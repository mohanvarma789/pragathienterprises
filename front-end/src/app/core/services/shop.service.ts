import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Shop } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ShopService {
    private readonly API_URL = `${environment.apiUrl}/shops`;
    private shops$ = new BehaviorSubject<Shop[]>([]);

    constructor(private http: HttpClient) {
        this.loadShops();
    }

    private loadShops(): void {
        // Initial load with a large limit to maintain existing behavior for now
        this.http.get<{ data: Shop[], meta: any }>(`${this.API_URL}?limit=1000`).subscribe(res => {
            this.shops$.next(res.data);
        });
    }

    getShops(): Observable<Shop[]> {
        return this.shops$.asObservable();
    }

    getShopById(id: string): Observable<Shop> {
        return this.http.get<Shop>(`${this.API_URL}/${id}`);
    }

    addShop(shop: Shop): Observable<Shop> {
        return this.http.post<Shop>(this.API_URL, shop).pipe(
            tap(newShop => {
                const current = [...this.shops$.value, newShop];
                this.shops$.next(current);
            })
        );
    }

    updateShop(updatedShop: Shop): Observable<Shop> {
        return this.http.put<Shop>(`${this.API_URL}/${updatedShop.id}`, updatedShop).pipe(
            tap(res => {
                const current = this.shops$.value.map(s =>
                    s.id === updatedShop.id ? res : s
                );
                this.shops$.next(current);
            })
        );
    }

    deleteShop(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
            tap(() => {
                const current = this.shops$.value.filter(s => s.id !== id);
                this.shops$.next(current);
            })
        );
    }

    toggleStatus(id: string): void {
        const shop = this.shops$.value.find(s => s.id === id);
        if (shop) {
            this.updateShop({ ...shop, isActive: !shop.isActive }).subscribe();
        }
    }

    addShops(newShops: Shop[]): Observable<any> {
        return this.http.post(`${this.API_URL}/bulk`, newShops).pipe(
            tap(() => this.loadShops())
        );
    }
}
