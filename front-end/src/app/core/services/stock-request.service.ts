import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { StockRequest, Order, InvoiceItem } from '../models/models';
import { InventoryService } from './inventory.service';
import { OrderService } from './order.service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class StockRequestService {
    private readonly API_URL = `${environment.apiUrl}/stock-requests`;
    private requests$ = new BehaviorSubject<StockRequest[]>([]);

    constructor(
        private http: HttpClient,
        private inventoryService: InventoryService,
        private orderService: OrderService
    ) {
        this.loadRequests();
        this.inventoryService.stockUpdate$.subscribe(productId => {
            if (productId) {
                this.processStockUpdate(productId);
            }
        });
    }

    private loadRequests(): void {
        this.http.get<StockRequest[]>(this.API_URL).subscribe(reqs => {
            this.requests$.next(reqs);
        });
    }

    addRequest(request: StockRequest): void {
        this.http.post<StockRequest>(this.API_URL, request).subscribe(() => {
            this.loadRequests();
        });
    }

    deleteRequest(id: string): void {
        this.http.delete(`${this.API_URL}/${id}`).subscribe(() => {
            this.loadRequests();
        });
    }

    getRequests(): Observable<StockRequest[]> {
        return this.requests$.asObservable();
    }

    private processStockUpdate(productId: string): void {
        const pendingRequests = this.requests$.value.filter(r => r.productId === productId && r.status === 'Pending');
        if (pendingRequests.length === 0) return;

        this.inventoryService.getProductById(productId).subscribe(product => {
            if (!product || product.stock <= 0) return;
            let availableStock = product.stock;
            pendingRequests.forEach(req => {
                if (req.requestedQty <= availableStock) {
                    this.fulfillRequest(req);
                    availableStock -= req.requestedQty;
                }
            });
        });
    }

    private fulfillRequest(req: StockRequest): void {
        let targetOrder = req.targetOrderId ? this.orderService.getOrderById(req.targetOrderId) : undefined;

        this.inventoryService.getProductById(req.productId).subscribe(product => {
            if (!product) return;

            const newItem: InvoiceItem = {
                productId: product.id,
                productName: product.name,
                hsn: product.hsn,
                rate: product.price,
                qty: req.requestedQty,
                amount: product.price * req.requestedQty
            };

            if (targetOrder && (targetOrder.status === 'Pending' || targetOrder.status === 'Urgent')) {
                const updatedOrder: Order = {
                    ...targetOrder,
                    items: [...targetOrder.items, newItem]
                };
                this.orderService.recalculateOrderTotals(updatedOrder);
                this.orderService.updateOrder(updatedOrder);
                this.http.put(`${this.API_URL}/${req.id}`, { status: 'Fulfilled' }).subscribe(() => this.loadRequests());
            } else {
                const newOrderId = 'INV-' + Math.floor(1000 + Math.random() * 9000);
                const newOrder: Order = {
                    id: newOrderId,
                    invoiceNo: newOrderId,
                    shopId: req.shopId,
                    date: new Date(),
                    items: [newItem],
                    status: req.priority === 'Urgent' ? 'Urgent' : 'Pending'
                } as Order;
                this.orderService.recalculateOrderTotals(newOrder);
                this.orderService.createOrder(newOrder);
                this.http.put(`${this.API_URL}/${req.id}`, { status: 'Converted' }).subscribe(() => this.loadRequests());
            }
        });
    }
}
