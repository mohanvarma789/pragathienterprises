import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ShopService } from '../../../core/services/shop.service';
import { ExportService } from '../../../core/services/export.service';
import { Order, Shop } from '../../../core/models/models';
import { Observable, combineLatest, BehaviorSubject, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { map, take, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-completed-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './completed-orders.component.html',
  styleUrls: ['./completed-orders.component.css']
})
export class CompletedOrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  searchTerm = '';
  showExportDropdown = false;
  private searchTermSubject = new BehaviorSubject<string>('');
  public selectedDate$ = new BehaviorSubject<string>('');
  public selectedVillage$ = new BehaviorSubject<string>('');
  villages$: Observable<string[]>;
  filteredOrders$!: Observable<any[]>;

  constructor(
    private orderService: OrderService,
    private shopService: ShopService,
    private exportService: ExportService,
    private spinner: NgxSpinnerService,
    private el: ElementRef
  ) {
    this.villages$ = this.shopService.getShops().pipe(
      takeUntil(this.destroy$),
      map(shops => Array.from(new Set(shops.map(s => s.village))).sort())
    );

    this.filteredOrders$ = combineLatest([
      this.orderService.getOrders(),
      this.shopService.getShops(),
      this.searchTermSubject.asObservable(),
      this.selectedDate$.asObservable(),
      this.selectedVillage$.asObservable()
    ]).pipe(
      takeUntil(this.destroy$),
      map(([orders, shops, term, date, village]: [Order[], Shop[], string, string, string]) => {
        const lowerTerm = term.toLowerCase();

        return orders
          .filter(o => o.status === 'Completed')
          .map((order: Order) => {
            const shop = shops.find((s: Shop) => s.id === order.shopId);
            return {
              ...order,
              shopName: shop ? shop.name : 'Unknown Shop',
              shopAddress: shop ? shop.address : '',
              shopVillage: shop ? shop.village : 'Unknown Village',
              shopDistrict: shop ? shop.district : 'Unknown District',
              itemsCount: order.items.length,
              itemNames: order.items.map(item => item.productName),
              isExpanded: false
            };
          })
          .filter((o: any) => {
            if (date) {
              const orderDate = new Date(o.date).toISOString().split('T')[0];
              if (orderDate !== date) return false;
            }
            if (village && o.shopVillage !== village) return false;
            return true;
          })
          .filter((order: any) =>
            order.invoiceNo.toLowerCase().includes(lowerTerm) ||
            order.shopName.toLowerCase().includes(lowerTerm)
          );
      })
    );
  }

  ngOnInit() {
    this.spinner.show();
    this.orderService.getOrders().pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
      this.spinner.hide();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showExportDropdown = false;
    }
  }

  onDateFilter(date: string) {
    this.selectedDate$.next(date);
  }

  onVillageFilter(village: string) {
    this.selectedVillage$.next(village);
    this.showExportDropdown = false;
  }

  onSearch(term: string) {
    this.searchTermSubject.next(term);
  }

  toggleExpand(order: any) {
    order.isExpanded = !order.isExpanded;
  }

  toggleDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;
  }

  moveToPending(order: any) {
    Swal.fire({
      title: 'Move to Pending?',
      text: 'Do you want to move this order back to the pending state?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, move it!',
      background: 'var(--card-bg)',
      color: 'var(--text-color)'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        const { shopName, shopAddress, shopVillage, shopDistrict, itemsCount, itemNames, isExpanded, ...orderData } = order;
        this.orderService.updateOrder({ ...orderData, status: 'Pending' } as Order);

        setTimeout(() => {
          this.spinner.hide();
          Swal.fire({
            title: 'Success!',
            text: 'Order moved to Pending.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
          });
        }, 800);
      }
    });
  }

  moveToUrgent(order: any) {
    Swal.fire({
      title: 'Move to Urgent?',
      text: 'Do you want to move this order to the urgent list?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2196f3',
      confirmButtonText: 'Yes, make it urgent!',
      background: 'var(--card-bg)',
      color: 'var(--text-color)'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        const { shopName, shopAddress, shopVillage, shopDistrict, itemsCount, itemNames, isExpanded, ...orderData } = order;
        this.orderService.updateOrder({ ...orderData, status: 'Urgent' } as Order);

        setTimeout(() => {
          this.spinner.hide();
          Swal.fire({
            title: 'Urgent!',
            text: 'Order moved to Urgent list.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
          });
        }, 800);
      }
    });
  }

  exportPDF() {
    this.filteredOrders$.pipe(take(1)).subscribe(orders => {
      if (!orders.length) return;
      const headers = [['Sl. No', 'Date', 'Invoice No', 'Shop', 'Total']];
      const tableData = orders.map((o, i) => [
        i + 1,
        new Date(o.date).toLocaleDateString(),
        o.invoiceNo.replace('INV-', '').replace('NV-', ''),
        o.shopName,
        o.totalAmount
      ]);
      this.exportService.exportToPDF('Completed Orders Report', headers, tableData, 'Completed_Orders');
    });
  }

  exportExcel() {
    this.filteredOrders$.pipe(take(1)).subscribe(orders => {
      if (!orders.length) return;
      const data = orders.map((o, i) => ({
        'Sl. No': i + 1,
        'Date': new Date(o.date).toLocaleDateString(),
        'Invoice No': o.invoiceNo.replace('INV-', '').replace('NV-', ''),
        'Shop': o.shopName,
        'Total': o.totalAmount
      }));
      this.exportService.exportToCSV(data, 'Completed_Orders');
    });
  }
}
