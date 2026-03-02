import { Component, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ShopService } from '../../../core/services/shop.service';
import { ExportService } from '../../../core/services/export.service';
import { Order, Shop } from '../../../core/models/models';
import { Observable, combineLatest, BehaviorSubject, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { map, takeUntil, take } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-urgent-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './urgent-orders.component.html',
  styleUrls: ['./urgent-orders.component.css']
})
export class UrgentOrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  searchTerm = '';
  showExportDropdown = false;
  private searchTermSubject = new BehaviorSubject<string>('');
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
      map(shops => Array.from(new Set(shops.map(s => s.village))).sort())
    );
  }

  ngOnInit() {
    this.spinner.show();
    this.orderService.getOrders().pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
      this.spinner.hide();
    });

    this.filteredOrders$ = combineLatest([
      this.orderService.getOrders(),
      this.shopService.getShops(),
      this.searchTermSubject.asObservable(),
      this.selectedVillage$.asObservable()
    ]).pipe(
      takeUntil(this.destroy$),
      map(([orders, shops, term, village]: [Order[], Shop[], string, string]) => {
        const lowerTerm = term.toLowerCase();

        return orders
          .filter(o => o.status === 'Urgent')
          .map(order => {
            const shop = shops.find(s => s.id === order.shopId);
            return {
              ...order,
              shopName: shop ? shop.name : 'Unknown Shop',
              shopAddress: shop ? shop.address : '',
              shopVillage: shop ? shop.village : 'Unknown Village',
              shopDistrict: shop ? shop.district : 'Unknown District',
              itemsCount: order.items.length,
              itemNames: order.items.map(item => item.productName || 'N/A'),
              isExpanded: false
            };
          })
          .filter(o => {
            const matchTerm = (o.invoiceNo || o.id).toLowerCase().includes(lowerTerm) ||
              o.shopName.toLowerCase().includes(lowerTerm);
            const matchVillage = !village || o.shopVillage === village;
            return matchTerm && matchVillage;
          });
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showExportDropdown = false;
    }
  }

  markAsPending(order: any) {
    Swal.fire({
      title: 'Move to Pending?',
      text: 'This order will be moved back to the Pending list.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, move it',
      background: 'var(--card-bg)',
      color: 'var(--text-color)'
    }).then(result => {
      if (result.isConfirmed) {
        const updatedOrder = { ...order, status: 'Pending' };
        this.cleanHelperProps(updatedOrder);
        this.orderService.updateOrder(updatedOrder);
        Swal.fire({ title: 'Moved!', icon: 'success', timer: 1500, showConfirmButton: false });
      }
    });
  }

  completeOrder(order: any) {
    Swal.fire({
      title: 'Complete Order?',
      text: 'Mark this urgent order as completed?',
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete',
      background: 'var(--card-bg)',
      color: 'var(--text-color)'
    }).then(result => {
      if (result.isConfirmed) {
        const updatedOrder = { ...order, status: 'Completed' };
        this.cleanHelperProps(updatedOrder);
        this.orderService.updateOrder(updatedOrder);
        Swal.fire({ title: 'Completed!', icon: 'success', timer: 1500, showConfirmButton: false });
      }
    });
  }

  deleteOrder(id: string) {
    Swal.fire({
      title: 'Delete Order?',
      text: 'Do you want to delete this order? Stock will be restored automatically.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete',
      background: 'var(--card-bg)',
      color: 'var(--text-color)'
    }).then(result => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.orderService.deleteOrder(id);
        setTimeout(() => {
          this.spinner.hide();
          Swal.fire({ title: 'Deleted!', icon: 'success', timer: 1500, showConfirmButton: false });
        }, 500);
      }
    });
  }

  exportPDF() {
    this.filteredOrders$.pipe(take(1)).subscribe(orders => {
      if (!orders.length) return;
      const headers = [['Sl. No', 'Date', 'Invoice No', 'Shop', 'Items', 'Total', 'Status']];
      const tableData = orders.map((o, i) => [
        i + 1,
        new Date(o.orderDate || o.date).toLocaleDateString(),
        (o.invoiceNo || o.id).replace('INV-', '').replace('NV-', ''),
        o.shopName,
        o.itemsCount,
        `Rs. ${o.totalAmount.toFixed(2)}`,
        o.status
      ]);
      this.exportService.exportToPDF('Urgent Orders Report', headers, tableData, 'Urgent_Orders');
    });
  }

  exportExcel() {
    this.filteredOrders$.pipe(take(1)).subscribe(orders => {
      if (!orders.length) return;
      const data = orders.map(o => ({
        'Invoice No': o.invoiceNo || o.id,
        'Date': new Date(o.orderDate || o.date).toLocaleDateString(),
        'Shop': o.shopName,
        'Village': o.shopVillage,
        'Items': o.itemsCount,
        'Total Amount': o.totalAmount,
        'Status': o.status
      }));
      this.exportService.exportToCSV(data, 'Urgent_Orders');
    });
  }

  private cleanHelperProps(order: any) {
    delete order.shopName;
    delete order.shopAddress;
    delete order.shopVillage;
    delete order.shopDistrict;
    delete order.itemsCount;
    delete order.itemNames;
    delete order.isExpanded;
  }
}
