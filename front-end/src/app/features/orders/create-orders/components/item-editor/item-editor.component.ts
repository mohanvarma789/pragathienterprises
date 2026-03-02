import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { ClickableImageDirective } from '../../../../../shared/directives/clickable-image.directive';

@Component({
    selector: 'app-item-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ClickableImageDirective],
    template: `
    <div class="card glass-panel mb-4" [formGroup]="parentForm">
      <div class="items-header mb-4">
        <h3 class="m-0">Order Items</h3>
        <div class="flex gap-2 items-center" *ngIf="items.length > 0">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" (input)="onSearch($event)" placeholder="Search product..." class="search-input-sm">
          </div>
        </div>
      </div>

      <div class="items-list" formArrayName="items">
        <div *ngFor="let item of items.controls; let i=index" [formGroupName]="i" 
             class="item-card glass-panel fade-in" [hidden]="!isRowVisible(i)">
          <div class="item-responsive-grid">
            <div class="item-image-col">
              <img *ngIf="getItemImage(item)" [src]="getItemImage(item)" class="item-thumb-res" 
                   appClickableImage [imageName]="getItemName(item)">
              <div *ngIf="!getItemImage(item)" class="item-thumb-placeholder-res">📦</div>
            </div>

            <div class="form-group item-product-col">
              <label>Product Name<span class="required-asterisk">*</span></label>
              <select formControlName="productId" (change)="onProductSelect.emit(i)">
                <option value="" disabled selected>-- Select Product --</option>
                <option *ngFor="let p of displayedProducts[i]" [value]="p.id"
                  [style.background-color]="p.stock <= 0 ? '#ef4444' : p.stock > 0 && p.stock <= 20 ? '#f59e0b' : null"
                  [style.color]="p.stock <= 0 ? 'white' : p.stock > 0 && p.stock <= 20 ? 'black' : null"
                  [style.font-weight]="p.stock <= 20 ? 'bold' : 'normal'">
                  {{ p.name }} (Stock: {{ p.stock }})
                </option>
              </select>
              <div *ngIf="item.get('productId')?.touched && item.get('productId')?.invalid" class="error-msg">Select a product</div>
              <div *ngIf="item.get('productId')?.value && isLowStock(item)" class="warning-msg-inline">
                ⚠️ Low Stock (Only {{ getStock(item) }} left!)
              </div>
            </div>

            <div class="form-group item-qty-col">
              <label>Quantity<span class="required-asterisk">*</span></label>
              <input type="number" formControlName="qty" (input)="onQtyChange.emit(i)" class="sm-input" placeholder="Enter Qty"
                [class.input-error]="!isOutOfStockPriority && item.get('productId')?.value && item.get('qty')?.value > getStock(item)">
              <div *ngIf="item.get('qty')?.touched && item.get('qty')?.invalid" class="error-msg">Required</div>
              <div *ngIf="!isOutOfStockPriority && item.get('productId')?.value && item.get('qty')?.value > getStock(item)" class="error-msg-inline">
                Insufficient Stock
              </div>
            </div>

            <div class="form-group item-amt-col">
              <label>Amount</label>
              <div class="amount-display">₹{{ item.get('amount')?.value | number:'1.2-2' }}</div>
            </div>

            <div class="item-remove-col">
              <button type="button" (click)="onRemoveItem.emit(i)" class="btn-icon text-danger">🗑️</button>
            </div>
          </div>
        </div>

        <div *ngIf="items.length > 0" class="item-actions-bottom mt-4">
          <button type="button" (click)="onAddItem.emit()" class="btn btn-secondary">+ Add Another Item</button>
        </div>
      </div>

      <div *ngIf="items.length > 0 && !hasVisibleRows && searchTerm" class="no-results-message fade-in">
        <p>No products found matching "{{ searchTerm }}"</p>
      </div>

      <div *ngIf="items.length === 0" class="empty-items fade-in">
        <p class="mb-4">No items added yet.</p>
        <button type="button" (click)="onAddItem.emit()" class="btn btn-secondary">+ Add Item to Start</button>
      </div>
    </div>
  `,
    styleUrls: ['../../create-orders.component.css']
})
export class ItemEditorComponent {
    @Input() parentForm!: FormGroup;
    @Input() items!: FormArray;
    @Input() displayedProducts: any[][] = [];
    @Input() productList: any[] = [];
    @Input() isOutOfStockPriority = false;
    @Input() searchTerm = '';
    @Input() hasVisibleRows = true;

    @Output() onProductSelect = new EventEmitter<number>();
    @Output() onQtyChange = new EventEmitter<number>();
    @Output() onRemoveItem = new EventEmitter<number>();
    @Output() onAddItem = new EventEmitter<void>();
    @Output() onSearchChange = new EventEmitter<string>();

    onSearch(event: Event) { this.onSearchChange.emit((event.target as HTMLInputElement).value); }

    getItemName(item: any): string { return this.productList.find(p => p.id === item.get('productId')?.value)?.name || ''; }
    getItemImage(item: any): string | undefined { return this.productList.find(p => p.id === item.get('productId')?.value)?.imageUrl; }
    getStock(item: any): number { return this.productList.find(p => p.id === item.get('productId')?.value)?.stock || 0; }
    isLowStock(item: any): boolean { const s = this.getStock(item); return s > 0 && s <= 20; }
    isRowVisible(index: number): boolean {
        if (!this.searchTerm) return true;
        const item = this.items.at(index);
        const pId = item.get('productId')?.value;
        if (!pId) return true;
        return this.getItemName(item).toLowerCase().includes(this.searchTerm.toLowerCase());
    }
}
