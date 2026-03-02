import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShopService } from '../../core/services/shop.service';
import { InventoryService } from '../../core/services/inventory.service';
import { OrderService } from '../../core/services/order.service';
import { Observable, combineLatest, map } from 'rxjs';
import { Shop, Product, Order } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container fade-in">
      <div class="grid grid-cols-3 mb-4">
        <!-- Revenue Card -->
        <div class="card glass-panel stats-card highlight-card">
          <div class="stats-icon revenue-icon" [class.skeleton]="(totalRevenue$ | async) === null">💰</div>
          <div>
            <h4>Total Revenue</h4>
            <div class="stats-value" [class.skeleton]="(totalRevenue$ | async) === null">
              {{ (totalRevenue$ | async) | currency:'INR':'symbol-narrow':'1.0-0' }}
            </div>
          </div>
        </div>

        <!-- Shops Card -->
        <a routerLink="/shops" class="card glass-panel stats-card hover-card shop-card">
          <div class="stats-icon shop-icon" [class.skeleton]="(allShops$ | async) === null">🏪</div>
          <div>
            <h4>All Shops</h4>
            <div class="stats-value" [class.skeleton]="(allShops$ | async) === null">
              {{ (allShops$ | async) ?? '00' }}
            </div>
          </div>
        </a>

        <!-- Orders Card -->
        <a routerLink="/orders" [queryParams]="{filter: 'pending'}" class="card glass-panel stats-card hover-card order-card">
          <div class="stats-icon order-icon" [class.skeleton]="(pendingOrders$ | async) === null">⏳</div>
          <div>
            <h4>Pending Orders</h4>
            <div class="stats-value" [class.skeleton]="(pendingOrders$ | async) === null">
              {{ (pendingOrders$ | async) ?? '00' }}
            </div>
          </div>
        </a>

        <!-- Completed Orders Card -->
        <a routerLink="/orders" [queryParams]="{filter: 'completed'}" class="card glass-panel stats-card hover-card completed-card">
          <div class="stats-icon completed-icon" [class.skeleton]="(completedOrders$ | async) === null">✅</div>
          <div>
            <h4>Completed</h4>
            <div class="stats-value" [class.skeleton]="(completedOrders$ | async) === null">
              {{ (completedOrders$ | async) ?? '00' }}
            </div>
          </div>
        </a>

        <!-- Out of Stock Card -->
        <a routerLink="/inventory" [queryParams]="{filter: 'out-of-stock'}" class="card glass-panel stats-card hover-card stock-card">
          <div class="stats-icon stock-icon" [class.skeleton]="(outOfStock$ | async) === null">🚫</div>
          <div>
            <h4>Out of Stock</h4>
            <div class="stats-value" [class.skeleton]="(outOfStock$ | async) === null">
              {{ (outOfStock$ | async) ?? '00' }}
            </div>
          </div>
        </a>

        <!-- Low Stock Card -->
        <a routerLink="/inventory" [queryParams]="{filter: 'low-stock'}" class="card glass-panel stats-card hover-card low-stock-card">
          <div class="stats-icon low-stock-icon" [class.skeleton]="(lowStock$ | async) === null">⚠️</div>
          <div>
            <h4>Low Stock</h4>
            <div class="stats-value" [class.skeleton]="(lowStock$ | async) === null">
              {{ (lowStock$ | async) ?? '00' }}
            </div>
          </div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .mb-4 { margin-bottom: 2rem; }
    
    .stats-card {
      display: flex;
      flex-direction: column; /* Stack vertically */
      align-items: center;    /* Center horizontally */
      justify-content: center; /* Center vertically */
      text-align: center;      /* Center text */
      gap: 0.75rem;           /* Tighter gap for column layout */
      text-decoration: none;
      color: inherit;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 2rem 1.5rem;   /* Adjusted padding */
      height: 100%;
      min-height: 180px;      /* Ensure consistent height */
    }
    .hover-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        cursor: pointer;
        border-color: var(--primary-color);
    }

    /* Individual Card Hover Colors - Premium Vibrant */
    .shop-card:hover { background: rgba(59, 130, 246, 0.12); border-color: rgba(59, 130, 246, 0.4); }
    .order-card:hover { background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.4); }
    .completed-card:hover { background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.4); }
    .stock-card:hover { background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.4); }
    .low-stock-card:hover { background: rgba(255, 193, 7, 0.12); border-color: rgba(255, 193, 7, 0.4); }

    .highlight-card {
      background: linear-gradient(135deg, rgba(255,215,0,0.05), rgba(218,165,32,0.1));
      border: 1px solid rgba(255,215,0,0.2);
    }
    .highlight-card:hover {
      background: linear-gradient(135deg, rgba(255,215,0,0.12), rgba(218,165,32,0.18));
      border-color: rgba(255,215,0,0.5);
      transform: translateY(-5px);
      box-shadow: 0 12px 25px rgba(218,165,32,0.25);
    }
    
    .stats-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    }
    .stats-card:hover .stats-icon {
      transform: scale(1.1) rotate(5deg);
      background: rgba(255,255,255,0.08);
    }
    
    .revenue-icon { color: #DAA520; text-shadow: 0 0 15px rgba(218, 165, 32, 0.5); }
    .shop-icon { color: var(--primary-color); text-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
    .order-icon { color: #f59e0b; text-shadow: 0 0 15px rgba(245, 158, 11, 0.5); }
    .completed-icon { color: var(--success-color); text-shadow: 0 0 15px rgba(16, 185, 129, 0.5); }
    .stock-icon { color: var(--danger-color); text-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
    .low-stock-icon { color: #ffc107; text-shadow: 0 0 15px rgba(255, 193, 7, 0.5); }

    /* Specific Alert Styling for Out of Stock */
    .stock-card .stats-value, .stock-card h4 {
      color: var(--danger-color);
    }
    
    .stats-value {
      font-size: 2.5rem; /* Standardized bigger size */
      font-weight: 700;
      line-height: 1;
    }
    
    h4 { 
      color: var(--text-muted); 
      font-size: 1rem; /* Standardized bigger size */
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
      margin-bottom: 4px;
      font-weight: 800;
    }

    /* Explicit Grid Styles */
    .grid {
      display: grid;
      gap: 1.5rem; /* Increased gap */
    }
    .grid-cols-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 1200px) {
       .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
       .grid-cols-3 { 
         grid-template-columns: repeat(2, 1fr); /* 2x2 grid style */
         gap: 0.75rem; 
       }
       .stats-card {
         padding: 1.25rem 0.75rem;
         min-height: 140px;
         gap: 0.5rem;
       }
       .stats-icon {
         width: 40px;
         height: 40px;
         font-size: 1.4rem;
       }
       .stats-value {
         font-size: 1.6rem !important; /* Force smaller size for mobile */
       }
       h4 {
         font-size: 0.75rem !important;
       }
    }

    .fade-in { animation: fadeIn 0.5s ease-in; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardComponent implements OnInit {
  allShops$: Observable<number>;
  pendingOrders$: Observable<number>;
  completedOrders$: Observable<number>;
  outOfStock$: Observable<number>;
  lowStock$: Observable<number>;
  totalRevenue$: Observable<number>;

  constructor(
    private shopService: ShopService,
    private inventoryService: InventoryService,
    private orderService: OrderService
  ) {
    this.allShops$ = this.shopService.getShops().pipe(
      map(shops => shops.length)
    );

    this.pendingOrders$ = this.orderService.getOrders().pipe(
      map(orders => orders.filter(o => o.status === 'Pending').length)
    );

    this.completedOrders$ = this.orderService.getOrders().pipe(
      map(orders => orders.filter(o => o.status === 'Completed').length)
    );

    this.outOfStock$ = this.inventoryService.getProducts().pipe(
      map(products => products.filter(p => p.stock === 0).length)
    );

    this.lowStock$ = this.inventoryService.getProducts().pipe(
      map(products => products.filter(p => p.stock > 0 && p.stock < 21).length) // Products with stock 1-20
    );

    this.totalRevenue$ = this.orderService.getOrders().pipe(
      map(orders => orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.totalAmount || 0), 0))
    );
  }

  ngOnInit() { }
}
