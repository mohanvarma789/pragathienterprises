import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { ShopService } from '../../../core/services/shop.service';
import { OrderService } from '../../../core/services/order.service';
import { StockRequestService } from '../../../core/services/stock-request.service';
import { ExportService } from '../../../core/services/export.service';
import { Product, Shop, Order } from '../../../core/models/models';
import { Observable, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, startWith, takeUntil, take } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-order-request',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './order-request.component.html',
    styleUrls: ['./order-request.component.css']
})
export class OrderRequestComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    villages$: Observable<string[]>;
    filteredShops$: Observable<Shop[]>;
    stockRequests$: Observable<any[]>;

    // Filters
    selectedVillage = '';
    selectedShopId = '';
    searchTerm = '';
    showExportDropdown = false;

    private villageSubject = new BehaviorSubject<string>('');
    private searchTermSubject = new BehaviorSubject<string>('');
    private shops: Shop[] = [];

    constructor(
        private inventoryService: InventoryService,
        private shopService: ShopService,
        private orderService: OrderService,
        private stockRequestService: StockRequestService,
        private exportService: ExportService,
        private router: Router,
        private spinner: NgxSpinnerService,
        private el: ElementRef
    ) {
        this.villages$ = this.shopService.getShops().pipe(
            takeUntil(this.destroy$),
            map(shops => Array.from(new Set(shops.map(s => s.village))).sort())
        );

        this.filteredShops$ = combineLatest([
            this.shopService.getShops(),
            this.villageSubject
        ]).pipe(
            takeUntil(this.destroy$),
            map(([shops, village]) => {
                if (!village) return [];
                return shops.filter(s => s.village === village && s.isActive);
            })
        );

        this.stockRequests$ = combineLatest([
            this.stockRequestService.getRequests(),
            this.inventoryService.getProducts(),
            this.shopService.getShops(),
            this.orderService.getOrders(),
            this.searchTermSubject.pipe(startWith('')),
            this.villageSubject.pipe(startWith(''))
        ]).pipe(
            takeUntil(this.destroy$),
            map(([requests, products, shops, orders, term, village]: [any[], Product[], Shop[], Order[], string, string]) => {
                const lowerTerm = term.toLowerCase();

                let enriched = requests.map(req => {
                    const product = products.find(p => p.id === req.productId);
                    const shop = shops.find(s => s.id === req.shopId);
                    const targetOrder = req.targetOrderId ? orders.find(o => o.id === req.targetOrderId) : null;

                    return {
                        ...req,
                        requestId: req.id,
                        date: req.requestDate,
                        productName: product ? product.name : 'Unknown Product',
                        productPrice: product ? product.price : 0,
                        shopName: shop ? shop.name : 'Unknown Shop',
                        shopAddress: shop ? shop.address : '',
                        shopVillage: shop ? shop.village : 'Unknown Village',
                        shopDistrict: shop ? shop.district : 'Unknown District',
                        targetInvoiceNo: targetOrder ? targetOrder.invoiceNo : 'N/A',
                        totalEstimated: (product ? product.price : 0) * req.requestedQty
                    };
                });

                if (village) {
                    enriched = enriched.filter(r => r.shopVillage === village);
                }

                if (lowerTerm) {
                    enriched = enriched.filter(r =>
                        r.productName.toLowerCase().includes(lowerTerm) ||
                        r.shopName.toLowerCase().includes(lowerTerm) ||
                        r.requestId.toLowerCase().includes(lowerTerm)
                    );
                }

                return enriched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            })
        );
    }

    ngOnInit() {
        this.spinner.show();
        this.shopService.getShops().pipe(take(1), takeUntil(this.destroy$)).subscribe(s => {
            this.shops = s;
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

    get noActiveShopsInVillage(): boolean {
        if (!this.selectedVillage) return false;
        const shopsInVillage = this.shops.filter(s => s.village === this.selectedVillage);
        const activeShops = shopsInVillage.filter(s => s.isActive);
        return shopsInVillage.length > 0 && activeShops.length === 0;
    }

    onVillageChange(village: string) {
        this.villageSubject.next(village);
        this.selectedShopId = '';
    }

    onSearch(term: string) {
        this.searchTermSubject.next(term);
    }

    toggleDropdown(event?: Event) {
        if (event) event.stopPropagation();
        this.showExportDropdown = !this.showExportDropdown;
    }

    exportPDF() {
        this.stockRequests$.pipe(take(1)).subscribe(requests => {
            if (!requests.length) return;
            const headers = [['Sl. No', 'Date', 'Shop', 'Product', 'Qty', 'Status']];
            const tableData = requests.map((r, i) => [
                i + 1,
                new Date(r.date).toLocaleDateString(),
                r.shopName,
                r.productName,
                r.requestedQty,
                r.status
            ]);
            this.exportService.exportToPDF('Backorder Requests Report', headers, tableData, 'Backorder_Report');
        });
    }

    exportCSV() {
        this.stockRequests$.pipe(take(1)).subscribe(requests => {
            if (!requests.length) return;
            const data = requests.map((r, i) => ({
                'Sl. No': i + 1,
                'Date': new Date(r.date).toLocaleDateString(),
                'Shop': r.shopName,
                'Product': r.productName,
                'Qty': r.requestedQty,
                'Status': r.status
            }));
            this.exportService.exportToCSV(data, 'Backorder_Requests');
        });
    }

    deleteRequest(id: string) {
        Swal.fire({
            title: 'Delete Request?',
            text: 'Are you sure you want to remove this backorder request?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#2196f3',
            confirmButtonText: 'Yes, delete it!',
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
        }).then((result) => {
            if (result.isConfirmed) {
                this.stockRequestService.deleteRequest(id);
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Request has been removed.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: 'var(--card-bg)',
                    color: 'var(--text-color)'
                });
            }
        });
    }

    createNewOrder(req: any) {
        this.router.navigate(['/orders/create'], {
            queryParams: {
                productId: req.productId,
                shopId: req.shopId,
                qty: req.requestedQty
            }
        });
    }
}
