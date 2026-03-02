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
  selector: 'app-view-pending-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './view-pending-orders.component.html',
  styleUrls: ['./view-pending-orders.component.css']
})
export class ViewPendingOrdersComponent implements OnInit, OnDestroy {
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
    private route: ActivatedRoute,
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
      this.selectedDate$.asObservable(),
      this.selectedVillage$.asObservable(),
      this.route.queryParams
    ]).pipe(
      takeUntil(this.destroy$),
      map(([orders, shops, term, date, village, params]: [Order[], Shop[], string, string, string, any]) => {
        const lowerTerm = term.toLowerCase();

        // Enrich orders
        let enriched = orders.map((order: Order) => {
          const shop = shops.find((s: Shop) => s.id === order.shopId);
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
        });

        // Filter by Status (default to Pending/Urgent based on component context or params)
        const filterParam = params['filter'];
        if (filterParam === 'completed') {
          enriched = enriched.filter(o => o.status === 'Completed');
        } else {
          // By default, view pending orders (which includes Urgent if not filtered out)
          enriched = enriched.filter(o => o.status === 'Pending' || o.status === 'Urgent');
        }

        // Filter by Date
        if (date) {
          enriched = enriched.filter(o => new Date(o.date).toISOString().split('T')[0] === date);
        }

        // Filter by Village
        if (village) {
          enriched = enriched.filter(o => o.shopVillage === village);
        }

        // Then filter by search
        return enriched.filter((order: any) =>
          (order.invoiceNo || order.id).toLowerCase().includes(lowerTerm) ||
          order.shopName.toLowerCase().includes(lowerTerm)
        );
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showExportDropdown = false;
    }
  }

  toggleDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showExportDropdown = !this.showExportDropdown;
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
      this.exportService.exportToPDF('Orders Report', headers, tableData, 'Orders_Report');
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
      this.exportService.exportToCSV(data, 'Orders_Report');
    });
  }

  deleteOrder(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this order? Stock will be restored automatically.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2196f3',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--card-bg)',
      color: 'var(--text-color)'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.orderService.deleteOrder(id);
        setTimeout(() => {
          this.spinner.hide();
          Swal.fire({
            title: 'Deleted!',
            text: 'Order has been deleted.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
          });
        }, 500);
      }
    });
  }

  completeOrder(order: any) {
    Swal.fire({
      title: 'Complete Order?',
      text: 'Do you want to mark this order as completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, complete it!',
      background: 'var(--card-bg)',
      color: 'var(--text-color)'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        const updatedOrder = { ...order, status: 'Completed' };
        // Clean up helper props
        delete (updatedOrder as any).shopName;
        delete (updatedOrder as any).shopAddress;
        delete (updatedOrder as any).shopVillage;
        delete (updatedOrder as any).shopDistrict;
        delete (updatedOrder as any).itemsCount;
        delete (updatedOrder as any).itemNames;
        delete (updatedOrder as any).isExpanded;

        this.orderService.updateOrder(updatedOrder);
        setTimeout(() => {
          this.spinner.hide();
          Swal.fire({
            title: 'Success!',
            text: 'Order marked as completed.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
          });
        }, 500);
      }
    });
  }

  markAsUrgent(order: any) {
    const updatedOrder = { ...order, status: 'Urgent' };
    delete (updatedOrder as any).shopName;
    delete (updatedOrder as any).shopAddress;
    delete (updatedOrder as any).shopVillage;
    delete (updatedOrder as any).shopDistrict;
    delete (updatedOrder as any).itemsCount;
    delete (updatedOrder as any).itemNames;
    delete (updatedOrder as any).isExpanded;

    this.orderService.updateOrder(updatedOrder);
  }
}
