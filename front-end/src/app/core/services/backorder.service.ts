import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrderService } from './order.service';
import { InventoryService } from './inventory.service';
import { InvoiceItem } from '../models/models';
import { environment } from '../../../environments/environment';

export interface BackorderRequest {
    productId: string;
    orderId: string;
    item: InvoiceItem;
}

@Injectable({
    providedIn: 'root'
})
export class BackorderService {
    private readonly API_URL = `${environment.apiUrl}/backorders`;

    constructor(
        private http: HttpClient,
        private orderService: OrderService,
        private inventoryService: InventoryService
    ) {
        this.inventoryService.stockUpdate$.subscribe(productId => {
            if (productId) {
                this.fulfillRequests(productId);
            }
        });
    }

    addRequest(orderId: string, item: InvoiceItem): void {
        this.http.post(this.API_URL, { productId: item.productId, orderId, item }).subscribe();
    }

    fulfillRequests(productId: string): void {
        this.http.get<BackorderRequest[]>(this.API_URL).subscribe(allRequests => {
            const toFulfill = allRequests.filter(r => r.productId === productId);
            if (toFulfill.length === 0) return;

            this.http.delete(`${this.API_URL}/product/${productId}`).subscribe(() => {
                toFulfill.forEach(request => {
                    this.orderService.getOrders().subscribe(orders => {
                        const order = orders.find(o => o.id === request.orderId);
                        if (order) {
                            const existingItem = order.items.find(i => i.productId === productId);
                            if (existingItem) {
                                existingItem.qty += request.item.qty;
                                existingItem.amount = existingItem.qty * existingItem.rate;
                            } else {
                                order.items.push({ ...request.item });
                            }
                            this.orderService.recalculateOrderTotals(order);
                            this.orderService.updateOrder(order);
                        }
                    });
                });
            });
        });
    }
}
