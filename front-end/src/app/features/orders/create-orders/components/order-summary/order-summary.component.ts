import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { ClickableImageDirective } from '../../../../../shared/directives/clickable-image.directive';

@Component({
    selector: 'app-order-summary',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ClickableImageDirective],
    template: `
    <div class="card glass-panel mb-4 total-card" [formGroup]="parentForm">
      <div class="summary-header-row mb-4">
        <h3 class="m-0">Order Summary</h3>
        <button type="button" (click)="onEditItems.emit()" class="btn-edit-compact">✎ Edit Items</button>
      </div>

      <div class="summary-list fade-in mb-6">
        <!-- Desktop View: Table -->
        <div class="desktop-summary-view">
          <table class="w-full summary-table">
            <thead>
              <tr>
                <th class="text-left">Product</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items.controls">
                <td>
                  <div class="flex items-center gap-2">
                    <img *ngIf="getItemImage(item)" [src]="getItemImage(item)" class="item-thumb-sm" 
                         appClickableImage [imageName]="getItemName(item)">
                    <span>{{ getItemName(item) }}</span>
                  </div>
                </td>
                <td class="text-center">{{ item.get('qty')?.value }}</td>
                <td class="text-right">₹{{ item.get('amount')?.value | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile View: Cards -->
        <div class="mobile-summary-view">
          <div *ngFor="let item of items.controls" class="summary-card-mobile flex flex-col">
            <div class="w-full text-center border-b border-white-10 pb-2 mb-3">
              <div class="font-bold text-md">{{ getItemName(item) }}</div>
            </div>
            <div class="flex flex-col items-center justify-center gap-4">
              <div class="mobile-img-container">
                <img *ngIf="getItemImage(item)" [src]="getItemImage(item)" class="item-thumb-lg" 
                     appClickableImage [imageName]="getItemName(item)">
              </div>
              <div class="mobile-details flex flex-row justify-center items-center text-center gap-6">
                <div class="text-muted text-sm">Qty: <span class="text-white font-mono text-xl font-bold">{{ item.get('qty')?.value }}</span></div>
                <div class="text-muted text-sm">Price: <span class="text-primary font-bold text-lg">₹{{ item.get('amount')?.value | number:'1.2-2' }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-divider mb-2"></div>

      <div class="text-right mb-2">
        <button type="button" (click)="onToggleGst.emit()" class="btn-edit-compact">{{ isEditingGst ? '✓ Done' : '✎ Edit GST' }}</button>
      </div>

      <div class="total-row"><span>Sub Total:</span><span>₹{{ subTotal | number:'1.2-2' }}</span></div>

      <div class="total-row items-center">
        <span *ngIf="!isEditingGst">CGST ({{ parentForm.get('cgstRate')?.value }}%):</span>
        <div *ngIf="isEditingGst" class="flex items-center gap-1">
          <span>CGST (</span><input type="number" formControlName="cgstRate" (input)="onGstChange.emit()" class="sm-input w-12 text-center">%):
        </div>
        <span>₹{{ cgst | number:'1.2-2' }}</span>
      </div>

      <div class="total-row items-center">
        <span *ngIf="!isEditingGst">SGST ({{ parentForm.get('sgstRate')?.value }}%):</span>
        <div *ngIf="isEditingGst" class="flex items-center gap-1">
          <span>SGST (</span><input type="number" formControlName="sgstRate" (input)="onGstChange.emit()" class="sm-input w-12 text-center">%):
        </div>
        <span>₹{{ sgst | number:'1.2-2' }}</span>
      </div>

      <div class="total-row grand-total pt-4 mt-4"><span>Grand Total:</span><span>₹{{ totalAmount | number:'1.2-2' }}</span></div>
    </div>
  `,
    styleUrls: ['../../create-orders.component.css']
})
export class OrderSummaryComponent {
    @Input() parentForm!: FormGroup;
    @Input() items!: FormArray;
    @Input() subTotal = 0;
    @Input() cgst = 0;
    @Input() sgst = 0;
    @Input() totalAmount = 0;
    @Input() isEditingGst = false;
    @Input() productList: any[] = [];

    @Output() onEditItems = new EventEmitter<void>();
    @Output() onToggleGst = new EventEmitter<void>();
    @Output() onGstChange = new EventEmitter<void>();

    getItemName(item: any): string {
        return item.get('productName')?.value || this.productList.find(p => p.id === item.get('productId')?.value)?.name || 'N/A';
    }

    getItemImage(item: any): string | undefined {
        return this.productList.find(p => p.id === item.get('productId')?.value)?.imageUrl;
    }
}
