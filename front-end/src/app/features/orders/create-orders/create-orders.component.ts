import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { OrderService } from '../../../core/services/order.service';
import { OrderWorkflowService } from '../../../core/services/order-workflow.service';
import { Shop, Product, Order, InvoiceItem } from '../../../core/models/models';
import { map, take, switchMap, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, combineLatest, of, defer, Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { ConstantsService } from '../../../core/services/constants.service';

// Sub-components
import { ShopSelectionComponent } from './components/shop-selection/shop-selection.component';
import { ItemEditorComponent } from './components/item-editor/item-editor.component';
import { OrderSummaryComponent } from './components/order-summary/order-summary.component';

@Component({
  selector: 'app-create-orders',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    ShopSelectionComponent,
    ItemEditorComponent,
    OrderSummaryComponent
  ],
  templateUrl: './create-orders.component.html',
  styleUrls: ['./create-orders.component.css']
})
export class CreateOrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  orderForm: FormGroup;
  filteredShops$: Observable<Shop[]>;
  villages$: Observable<string[]>;
  isVillageInactive$: Observable<boolean>;
  products$: Observable<Product[]>;
  selectedShop: Shop | undefined;
  selectedShop$: Observable<Shop | undefined>;
  priority$: Observable<string>;
  orderMode$: Observable<string>;
  isEditingGst = false;
  isItemsSaved = false;

  public selectedVillage$ = new BehaviorSubject<string>('');
  public productSearchTerm$ = new BehaviorSubject<string>('');

  subTotal = 0;
  cgst = 0;
  sgst = 0;
  totalAmount = 0;
  allProducts: Product[] = [];
  filteredProducts$: Observable<Product[]>;
  editingOrderId: string | null = null;
  openInvoices$: Observable<Order[]> = new BehaviorSubject([]);
  productList: Product[] = [];
  displayedProducts: Product[][] = [];

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private inventoryService: InventoryService,
    private orderService: OrderService,
    private workflowService: OrderWorkflowService,
    private router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    public constants: ConstantsService
  ) {
    this.orderForm = this.fb.group({
      shopId: ['', Validators.required],
      orderMode: ['New', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      items: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      priority: ['Normal', Validators.required],
      cgstRate: [this.constants.DEFAULT_TAX_RATE],
      sgstRate: [this.constants.DEFAULT_TAX_RATE],
      cgst: [0],
      sgst: [0]
    });

    const allShops$ = this.shopService.getShops();
    this.products$ = this.inventoryService.getProducts();

    this.products$.pipe(takeUntil(this.destroy$)).subscribe(p => this.allProducts = p);

    this.selectedShop$ = combineLatest([
      allShops$,
      this.orderForm.get('shopId')!.valueChanges.pipe(startWith(this.orderForm.get('shopId')?.value || ''))
    ]).pipe(
      map(([shops, shopId]) => shops.find(s => s.id === shopId)),
      distinctUntilChanged((prev, curr) => prev?.id === curr?.id)
    );

    this.selectedShop$.pipe(takeUntil(this.destroy$)).subscribe(shop => this.selectedShop = shop);

    this.priority$ = this.orderForm.get('priority')!.valueChanges.pipe(
      startWith(this.orderForm.get('priority')?.value || 'Normal')
    );

    this.orderMode$ = this.orderForm.get('orderMode')!.valueChanges.pipe(
      startWith(this.orderForm.get('orderMode')?.value || 'New')
    );

    this.filteredProducts$ = combineLatest([
      this.products$,
      this.productSearchTerm$.pipe(debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([products, term]) => {
        let filtered = products.filter(p => p.stock > 0);
        if (!term) return filtered;
        const lowerTerm = term.toLowerCase();
        return filtered.filter(p => p.name.toLowerCase().includes(lowerTerm));
      })
    );

    const relevantShops$ = combineLatest([
      allShops$,
      this.orderForm.get('orderMode')!.valueChanges.pipe(startWith(this.orderForm.get('orderMode')?.value || 'New')),
      this.orderService.getOrders()
    ]).pipe(
      map(([shops, mode, orders]) => {
        if (mode === 'New') return shops;
        const activeShopIds = new Set(orders.filter(o => o.status === 'Pending' || o.status === 'Urgent').map(o => o.shopId));
        return shops.filter(s => activeShopIds.has(s.id));
      })
    );

    this.villages$ = relevantShops$.pipe(map(shops => Array.from(new Set(shops.map(s => s.village))).sort()));

    this.isVillageInactive$ = combineLatest([relevantShops$, this.selectedVillage$]).pipe(
      map(([shops, selectedVillage]) => {
        if (!selectedVillage) return false;
        const shopsInVillage = shops.filter(s => s.village === selectedVillage);
        return shopsInVillage.length > 0 && shopsInVillage.every(s => !s.isActive);
      })
    );

    this.filteredShops$ = combineLatest([relevantShops$, this.selectedVillage$]).pipe(
      map(([shops, village]) => {
        let filtered = shops.filter(s => s.isActive);
        if (village) filtered = filtered.filter(s => s.village === village);
        return filtered;
      })
    );

    this.openInvoices$ = this.orderForm.valueChanges.pipe(
      startWith(this.orderForm.value),
      switchMap(val => {
        const shopId = val?.shopId;
        const mode = val?.orderMode;
        if (mode !== 'Existing' || !shopId) return of([]);
        return this.orderService.getOrders().pipe(
          map(orders => (orders || []).filter(o =>
            String(o.shopId).trim().toLowerCase() === String(shopId).trim().toLowerCase() &&
            (o.status.toLowerCase() === 'pending' || o.status.toLowerCase() === 'urgent')
          ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        );
      })
    );
  }

  ngOnInit() {
    this.productSearchTerm$.next('');

    combineLatest([
      this.products$.pipe(take(1)),
      this.shopService.getShops().pipe(take(1)),
      this.route.paramMap.pipe(take(1)),
      this.route.queryParams.pipe(take(1))
    ]).pipe(takeUntil(this.destroy$)).subscribe(([products, shops, params, queryParams]) => {
      this.allProducts = products;
      const id = params.get('id');
      if (id) {
        this.editingOrderId = id;
        this.loadOrderFromData(id, queryParams['addProductId'], products, shops);
      } else if (queryParams['productId'] && queryParams['shopId']) {
        this.handleNewOrderPreFillFromData(queryParams['productId'], queryParams['shopId'], products, shops, +queryParams['qty']);
      }
    });

    combineLatest([
      this.products$,
      this.productSearchTerm$.pipe(startWith('')),
      this.items.valueChanges.pipe(startWith(this.items.value || [])),
      this.orderForm.get('priority')!.valueChanges.pipe(startWith(this.orderForm.get('priority')?.value || 'Normal'))
    ]).pipe(takeUntil(this.destroy$)).subscribe(([products, term, items, priority]) => {
      this.productList = products;
      const currentItems = (items || []) as any[];
      let priorityFiltered = priority.includes('Out of Stock') ? products.filter(p => p.stock <= 0) : products.filter(p => p.stock > 0);
      if (term) {
        const lowerTerm = term.toLowerCase();
        priorityFiltered = priorityFiltered.filter(p => p.name.toLowerCase().includes(lowerTerm));
      }
      this.displayedProducts = currentItems.map((currentItem, currentIndex) => {
        const currentId = currentItem.productId;
        const otherSelectedIds = currentItems.filter((_, index) => index !== currentIndex).map((item: any) => item.productId).filter((id: string) => id);
        return priorityFiltered.filter(p => !otherSelectedIds.includes(p.id) || p.id === currentId);
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get items() { return this.orderForm.get('items') as FormArray; }

  createItem(product?: Product, qty: number | null = null): FormGroup {
    return this.fb.group({
      productId: [product?.id || '', Validators.required],
      productName: [product?.name || ''],
      hsn: [product?.hsn || this.constants.DEFAULT_HSN, Validators.required],
      rate: [product?.price || 0, Validators.required],
      qty: [qty, [Validators.required, Validators.min(1)]],
      amount: [product ? (product.price * (qty || 0)) : 0]
    });
  }

  addItem() {
    if (!this.canAddItem()) {
      this.showWarning('Product Required', 'Please select a product for the current row before adding another item.');
      return;
    }
    this.items.push(this.createItem());
    this.calculateTotals();
  }

  removeItem(index: number) { this.items.removeAt(index); this.calculateTotals(); }

  onVillageChange(village: string) {
    this.selectedVillage$.next(village);
    this.orderForm.patchValue({ shopId: '' });
    this.selectedShop = undefined;
  }

  onShopSelect() {
    const id = this.orderForm.get('shopId')?.value;
    this.shopService.getShops().pipe(take(1)).subscribe(shops => {
      this.selectedShop = shops.find(s => s.id === id);
      while (this.items.length) this.items.removeAt(0);
      this.isItemsSaved = false;
      this.calculateTotals();
    });
  }

  onProductSelect(index: number) {
    const item = this.items.at(index);
    const product = this.productList.find(p => p.id === item.get('productId')?.value);
    if (product) {
      item.patchValue({ productName: product.name, hsn: product.hsn || this.constants.DEFAULT_HSN, rate: product.price, amount: product.price * (item.get('qty')?.value || 0) });
      this.calculateTotals();
    }
  }

  updateAmount(index: number) {
    const item = this.items.at(index);
    const qty = item.get('qty')?.value;
    const product = this.productList.find(p => p.id === item.get('productId')?.value);

    if (qty < 0) {
      this.showError('Invalid Quantity', 'Quantity cannot be negative.');
      item.patchValue({ qty: null, amount: 0 });
      return;
    }

    if (product && qty > product.stock && !this.orderForm.get('priority')?.value?.includes('Out of Stock')) {
      this.showError('Insufficient Stock', `Available: ${product.stock}`);
    }

    item.patchValue({ amount: (item.get('rate')?.value || 0) * (qty || 0) });
    this.calculateTotals();
  }

  calculateTotals() {
    this.subTotal = this.items.controls.reduce((acc, curr) => acc + (curr.get('amount')?.value || 0), 0);
    const cr = this.orderForm.get('cgstRate')?.value || 0;
    const sr = this.orderForm.get('sgstRate')?.value || 0;
    this.cgst = this.subTotal * (cr / 100);
    this.sgst = this.subTotal * (sr / 100);
    this.orderForm.patchValue({ cgst: +this.cgst.toFixed(2), sgst: +this.sgst.toFixed(2) }, { emitEvent: false });
    this.totalAmount = this.subTotal + this.cgst + this.sgst;
  }

  onSubmit() {
    if (this.items.length === 0) return this.showWarning('No Items', 'Add at least one product.');
    if (!this.canAddItem()) return this.showWarning('Incomplete Row', 'Select a product for all rows.');

    if (!this.isItemsSaved) {
      this.isItemsSaved = true;
      return this.showSuccess('Items Confirmed', 'Order summary generated.');
    }

    if (this.orderForm.valid) {
      const formVal = this.orderForm.value;
      const orderData: Order = {
        id: this.editingOrderId || 'INV-' + Math.floor(1000 + Math.random() * 9000),
        invoiceNo: this.editingOrderId || '',
        shopId: formVal.shopId,
        date: new Date(formVal.date),
        items: formVal.items,
        subTotal: this.subTotal,
        cgst: formVal.cgst,
        sgst: formVal.sgst,
        totalAmount: this.totalAmount,
        status: formVal.priority.includes('Urgent') ? 'Urgent' : 'Pending'
      };

      this.spinner.show();
      this.workflowService.processOrderCreation(orderData, formVal.priority, formVal.orderMode).pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.spinner.hide();
        if (res.type === 'BACKORDER_QUEUED') {
          this.showInfo('Backorder Queued', 'Out of stock items queued.');
          this.router.navigate(['/orders']);
        } else {
          this.showSuccess('Order Submitted', 'Success!');
          this.router.navigate([formVal.priority.includes('Urgent') ? '/orders/urgent' : '/orders']);
        }
      });
    }
  }

  // Helper Methods
  canAddItem(): boolean { return this.items.length === 0 || !!this.items.at(this.items.length - 1).get('productId')?.value; }
  private showWarning(title: string, text: string) { Swal.fire({ title, text, icon: 'warning', confirmButtonColor: '#2196f3', background: 'var(--card-bg)', color: 'var(--text-color)', heightAuto: false }); }
  private showError(title: string, text: string) { Swal.fire({ title, text, icon: 'error', confirmButtonColor: '#2196f3', background: 'var(--card-bg)', color: 'var(--text-color)', heightAuto: false }); }
  private showSuccess(title: string, text: string) { Swal.fire({ title, text, icon: 'success', timer: 1500, showConfirmButton: false, background: 'var(--card-bg)', color: 'var(--text-color)', heightAuto: false }); }
  private showInfo(title: string, text: string) { Swal.fire({ title, text, icon: 'info', confirmButtonColor: '#2196f3', background: 'var(--card-bg)', color: 'var(--text-color)', heightAuto: false }); }

  onSearchChange(term: string) { this.productSearchTerm$.next(term); }
  toggleItemsSave() { if (!this.isItemsSaved && !this.canAddItem()) return this.showWarning('Product Required', 'Select product for all items.'); this.isItemsSaved = !this.isItemsSaved; if (!this.isItemsSaved) this.productSearchTerm$.next(''); }
  toggleGstEdit() { this.isEditingGst = !this.isEditingGst; if (!this.isEditingGst) this.calculateTotals(); }
  onInvoiceSelect(event: Event) { const id = (event.target as HTMLSelectElement).value; if (id) { this.editingOrderId = id; this.loadOrder(id); } }
  loadOrder(id: string) { this.shopService.getShops().pipe(take(1)).subscribe(shops => this.loadOrderFromData(id, undefined, this.allProducts, shops)); }

  loadOrderFromData(id: string, addProductId: string | undefined, products: Product[], shops: Shop[]) {
    const order = this.orderService.getOrderById(id);
    if (!order) return;
    const shop = shops.find(s => s.id === order.shopId);
    if (shop) { this.selectedVillage$.next(shop.village); this.selectedShop = shop; }
    this.orderForm.patchValue({ shopId: order.shopId, date: new Date(order.date).toISOString().substring(0, 10), cgstRate: (order.cgst / order.subTotal) * 100, sgstRate: (order.sgst / order.subTotal) * 100, priority: order.status === 'Urgent' ? 'Urgent' : 'Normal' });
    while (this.items.length) this.items.removeAt(0);
    order.items.forEach(item => this.items.push(this.createItem(products.find(p => p.id === item.productId), item.qty)));
    if (addProductId) {
      const existing = this.items.controls.find(c => c.get('productId')?.value === addProductId);
      if (existing) existing.patchValue({ qty: (existing.get('qty')?.value || 0) + 1 });
      else { const p = products.find(prod => prod.id === addProductId); if (p) this.items.push(this.createItem(p, 1)); }
    }
    this.calculateTotals();
  }

  handleNewOrderPreFillFromData(productId: string, shopId: string, products: Product[], shops: Shop[], qty?: number) {
    const shop = shops.find(s => s.id === shopId);
    if (shop) {
      this.selectedVillage$.next(shop.village);
      this.orderForm.patchValue({ shopId });
      this.selectedShop = shop;
      const product = products.find(p => p.id === productId);
      if (product) { this.items.push(this.createItem(product, qty || 1)); this.calculateTotals(); }
    }
  }

  public isAnyProductVisible(): boolean {
    if (!this.displayedProducts || this.displayedProducts.length === 0) return false;
    return this.displayedProducts.some(row => row.some(p => p.name !== 'None'));
  }
}
