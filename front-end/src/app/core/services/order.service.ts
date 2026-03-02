import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private readonly API_URL = `${environment.apiUrl}/orders`;
    private orders$ = new BehaviorSubject<Order[]>([]);

    constructor(private http: HttpClient) {
        this.loadOrders();
    }

    private loadOrders(): void {
        this.http.get<Order[]>(this.API_URL).subscribe(orders => {
            this.orders$.next(orders);
        });
    }

    getOrders(): Observable<Order[]> {
        return this.orders$.asObservable();
    }

    getOrdersByShop(shopId: string): Observable<Order[]> {
        return this.orders$.pipe(
            map(orders => orders.filter(o => o.shopId === shopId))
        );
    }

    createOrder(order: Order): Observable<Order> {
        return this.http.post<Order>(this.API_URL, order).pipe(
            map(newOrder => {
                this.loadOrders();
                return newOrder;
            })
        );
    }

    getOrderById(id: string): Order | undefined {
        return this.orders$.value.find(o => o.id === id);
    }

    updateOrder(updatedOrder: Order): Observable<Order> {
        return this.http.put<Order>(`${this.API_URL}/${updatedOrder.id}`, updatedOrder).pipe(
            map(res => {
                this.loadOrders();
                return res;
            })
        );
    }

    deleteOrder(id: string): void {
        this.http.delete(`${this.API_URL}/${id}`).subscribe(() => {
            this.loadOrders();
        });
    }

    recalculateOrderTotals(order: Order): Order {
        if (!order.items) order.items = [];
        const subTotal = order.items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const cgstRate = order.subTotal > 0 ? (order.cgst / order.subTotal) * 100 : 9;
        const sgstRate = order.subTotal > 0 ? (order.sgst / order.subTotal) * 100 : 9;
        order.subTotal = subTotal;
        order.cgst = Number((subTotal * (cgstRate / 100)).toFixed(2));
        order.sgst = Number((subTotal * (sgstRate / 100)).toFixed(2));
        order.totalAmount = subTotal + order.cgst + order.sgst;
        order.totalBeforeTax = subTotal;
        order.taxAmount = Number((order.cgst + order.sgst).toFixed(2));
        order.totalAfterTax = order.totalAmount;
        order.grandTotal = order.totalAmount;
        return order;
    }
}
