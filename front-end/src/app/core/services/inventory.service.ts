import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Product } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private readonly API_URL = `${environment.apiUrl}/products`;
    private products$ = new BehaviorSubject<Product[]>([]);
    private stockUpdateSubject = new BehaviorSubject<string | null>(null);
    public stockUpdate$ = this.stockUpdateSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadInventory();
    }

    private loadInventory(): void {
        this.http.get<{ data: Product[], meta: any }>(`${this.API_URL}?limit=1000`).subscribe(res => {
            this.products$.next(res.data);
        });
    }

    getProducts(): Observable<Product[]> {
        return this.products$.asObservable();
    }

    updateStock(productId: string, quantityChange: number): void {
        const product = this.products$.value.find(p => p.id === productId);
        if (product) {
            this.http.put<Product>(`${this.API_URL}/${productId}`, { stock: product.stock - quantityChange }).subscribe(() => {
                this.loadInventory();
            });
        }
    }

    addStock(productId: string, amount: number): void {
        const product = this.products$.value.find(p => p.id === productId);
        if (product) {
            this.http.put<Product>(`${this.API_URL}/${productId}`, { stock: product.stock + amount }).subscribe(() => {
                this.loadInventory();
                this.stockUpdateSubject.next(productId);
            });
        }
    }

    getProductById(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.API_URL}/${id}`);
    }

    addProduct(product: Product): Observable<Product> {
        return this.http.post<Product>(this.API_URL, product).pipe(
            tap(() => this.loadInventory())
        );
    }

    updateProduct(updatedProduct: Product): Observable<Product> {
        return this.http.put<Product>(`${this.API_URL}/${updatedProduct.id}`, updatedProduct).pipe(
            tap(() => this.loadInventory())
        );
    }

    deleteProduct(id: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
            tap(() => this.loadInventory())
        );
    }

    addProducts(newProducts: Product[]): Observable<any> {
        return this.http.post(`${this.API_URL}/bulk`, newProducts).pipe(
            tap(() => this.loadInventory())
        );
    }
}
