import { Injectable } from '@angular/core';
import { OrderService } from './order.service';
import { StockRequestService } from './stock-request.service';
import { InventoryService } from './inventory.service';
import { Order, Product, InvoiceItem } from '../models/models';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class OrderWorkflowService {
    constructor(
        private orderService: OrderService,
        private stockRequestService: StockRequestService,
        private inventoryService: InventoryService
    ) { }

    processOrderCreation(orderData: Order, priority: string, orderMode: string): Observable<any> {
        if (orderMode === 'Existing' && priority.includes('Out of Stock')) {
            const outOfStockItems = this.getOutOfStockItems(orderData.items);
            if (outOfStockItems.length > 0) {
                this.queueBackorders(outOfStockItems, orderData, priority);
                return of({ type: 'BACKORDER_QUEUED' });
            }
        }

        return this.orderService.createOrder(orderData).pipe(
            map(res => ({ type: 'SUCCESS', data: res }))
        );
    }

    private getOutOfStockItems(items: InvoiceItem[]): any[] {
        // This would ideally check against actual stock state from inventory service
        // For simplicity, we assume the component already flagged them or we fetch again
        return items; // Placeholder logic
    }

    private queueBackorders(items: any[], order: Order, priority: string) {
        items.forEach(item => {
            this.stockRequestService.addRequest({
                id: 'REQ-' + Math.floor(10000 + Math.random() * 90000),
                productId: item.productId,
                shopId: order.shopId,
                targetOrderId: order.id,
                requestedQty: item.qty,
                status: 'Pending',
                requestDate: new Date(),
                priority: priority.includes('Urgent') ? 'Urgent' : 'Normal'
            });
        });
    }
}
