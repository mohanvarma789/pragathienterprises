import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-shop-selection',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    template: `
    <div class="card glass-panel" [formGroup]="parentForm">
      <h3 class="section-heading">Customer Details</h3>
      <div class="form-group">
        <label>Village/Town<span class="required-asterisk">*</span></label>
        <select [ngModel]="selectedVillage" (ngModelChange)="onVillageChange.emit($event)" [ngModelOptions]="{standalone: true}">
          <option value="" disabled selected>-- Select Village --</option>
          <option *ngFor="let village of villages" [value]="village">{{ village }}</option>
        </select>
      </div>

      <div *ngIf="isVillageInactive" class="alert alert-danger fade-in mt-4">
        ⚠️ <strong>Notice:</strong> This village has no active shops. Please reactivate shops in "View Shops" to place orders.
      </div>

      <div *ngIf="selectedVillage && !isVillageInactive" class="form-group mb-4">
        <label>Select Shop<span class="required-asterisk">*</span></label>
        <select formControlName="shopId" (change)="onShopSelect.emit()">
          <option value="" disabled selected>-- Select Shop --</option>
          <option *ngFor="let shop of filteredShops" [value]="shop.id">{{ shop.name }}</option>
        </select>
        <div *ngIf="parentForm.get('shopId')?.touched && parentForm.get('shopId')?.invalid" class="error-msg">Please select a shop</div>
        <p *ngIf="filteredShops.length === 0" class="text-danger-custom text-xs mt-1">No active shops found in this village.</p>
      </div>

      <div class="form-group mb-4">
        <label>Select Priority</label>
        <select formControlName="priority" (change)="onPriorityChange.emit()" class="priority-select"
          [class.urgent-selected]="parentForm.get('priority')?.value?.includes('Urgent')">
          <option value="Normal">Normal Priority</option>
          <option value="Urgent" style="background-color: #ef4444; color: white;">Urgent Priority</option>
          <option value="Out of Stock (Normal)">Out of Stock (Normal)</option>
          <option value="Out of Stock (Urgent)" style="background-color: #ef4444; color: white;">Out of Stock (Urgent)</option>
        </select>
      </div>

      <div class="form-group mb-4" *ngIf="parentForm.get('priority')?.value?.includes('Out of Stock')">
        <label>Order Mode</label>
        <select formControlName="orderMode" class="form-select">
          <option value="New">Create New Order</option>
          <option value="Existing">Add to Existing Order</option>
        </select>
      </div>

      <div class="form-group mt-4" *ngIf="parentForm.get('orderMode')?.value === 'Existing' && selectedShop">
        <label>Select Invoice to Append To<span class="required-asterisk">*</span></label>
        <select (change)="onInvoiceSelect.emit($event)" class="form-select">
          <option value="" disabled selected>-- Select Invoice --</option>
          <option *ngFor="let invoice of openInvoices" [value]="invoice.id">
            {{ invoice.invoiceNo }} - {{ invoice.date | date:'shortDate' }} (₹{{ invoice.totalAmount }})
          </option>
        </select>
      </div>

      <div *ngIf="selectedShop" class="shop-preview">
        <div class="grid grid-cols-2 gap-2 mt-2">
          <p class="m-0"><strong>District:</strong> {{ selectedShop.district }}</p>
          <p class="m-0"><strong>Pincode:</strong> {{ selectedShop.pincode }}</p>
          <p class="m-0"><strong>GSTIN:</strong> {{ selectedShop.gstin }}</p>
          <p class="m-0"><strong>Mobile:</strong> {{ selectedShop.mobile }}</p>
        </div>
        <div class="mt-2 border-t pt-2 address-row">
          <strong class="whitespace-nowrap">Address:</strong>
          <p class="m-0">{{ selectedShop.address }}</p>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['../../create-orders.component.css']
})
export class ShopSelectionComponent {
    @Input() parentForm!: FormGroup;
    @Input() villages: string[] = [];
    @Input() selectedVillage = '';
    @Input() isVillageInactive = false;
    @Input() filteredShops: any[] = [];
    @Input() selectedShop: any;
    @Input() openInvoices: any[] = [];

    @Output() onVillageChange = new EventEmitter<string>();
    @Output() onShopSelect = new EventEmitter<void>();
    @Output() onPriorityChange = new EventEmitter<void>();
    @Output() onInvoiceSelect = new EventEmitter<Event>();
}
