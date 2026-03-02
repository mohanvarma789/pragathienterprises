import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ShopService } from '../../../core/services/shop.service';
import { Order, Shop, InvoiceItem } from '../../../core/models/models';
import { map, take, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { ConstantsService } from '../../../core/services/constants.service';

@Component({
  selector: 'app-edit-invoice',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './edit-invoice.component.html',
  styleUrls: ['./edit-invoice.component.css']
})
export class EditInvoiceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  invoiceForm: FormGroup;
  order: Order | undefined;
  allOrders: Order[] = [];
  isNewOrder = false;

  // Dropdown Observables
  villages$!: Observable<string[]>;
  filteredShops$!: Observable<Shop[]>;
  filteredOrders$!: Observable<Order[]>;
  selectedVillage$ = new BehaviorSubject<string>('');
  selectedShopId$ = new BehaviorSubject<string>('');
  isVillageInactive$!: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private shopService: ShopService,
    private spinner: NgxSpinnerService,
    public constants: ConstantsService
  ) {
    this.invoiceForm = this.fb.group({
      invoiceNo: [''],
      date: ['', Validators.required],
      shopId: [''],
      reverseCharge: ['No'],
      paymentMode: ['Cash'],
      vehicleNo: [''],
      eWayBillNo: [''],

      companyName: [this.constants.COMPANY_NAME],
      companyGSTIN: [this.constants.COMPANY_GSTIN],
      companyCell: [this.constants.COMPANY_CELL],
      companyAddress: [this.constants.COMPANY_ADDRESS],

      billedToName: [''],
      billedToAddress: [''],
      billedToPhone: [''],
      billedToGSTIN: [''],
      billedToState: [''],
      billedToCode: [''],

      shippedToName: [''],
      shippedToAddress: [''],
      shippedToPhone: [''],
      shippedToGSTIN: [''],
      shippedToState: [''],
      shippedToCode: [''],

      bankAccNo: [this.constants.COMPANY_BANK_ACC],
      bankIFSC: [this.constants.COMPANY_BANK_IFSC],
      bankName: [this.constants.COMPANY_BANK_NAME],

      items: this.fb.array([], [Validators.required, Validators.minLength(1)]),

      totalBeforeTax: [0],
      cgst: [0],
      sgst: [0],
      taxAmount: [0],
      grandTotal: [0],
      rupeeInWords: ['']
    });
  }

  get itemsFormArray() {
    return this.invoiceForm.get('items') as FormArray;
  }

  ngOnInit() {
    this.orderService.getOrders().pipe(takeUntil(this.destroy$)).subscribe(orders => {
      this.allOrders = orders;
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    }

    this.villages$ = this.shopService.getShops().pipe(
      takeUntil(this.destroy$),
      map(shops => {
        const villages = shops.map(s => s.village || 'Unknown');
        return [...new Set(villages)].sort();
      })
    );

    this.filteredShops$ = combineLatest([
      this.shopService.getShops(),
      this.selectedVillage$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([shops, village]) => {
        let filtered = shops.filter(s => s.isActive);
        if (!village) return filtered;
        return filtered.filter(s => (s.village || 'Unknown') === village);
      })
    );

    this.isVillageInactive$ = combineLatest([
      this.shopService.getShops(),
      this.selectedVillage$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([shops, selectedVillage]) => {
        if (!selectedVillage) return false;
        const shopsInVillage = shops.filter(s => (s.village || 'Unknown') === selectedVillage);
        return shopsInVillage.length > 0 && shopsInVillage.every(s => !s.isActive);
      })
    );

    this.filteredOrders$ = combineLatest([
      this.orderService.getOrders(),
      this.selectedVillage$,
      this.selectedShopId$,
      this.shopService.getShops()
    ]).pipe(
      takeUntil(this.destroy$),
      map(([orders, village, shopId, shops]) => {
        let filtered = orders;

        if (village) {
          const villageShopIds = shops
            .filter(s => (s.village || 'Unknown') === village)
            .map(s => s.id);
          filtered = filtered.filter(o => villageShopIds.includes(o.shopId));
        }

        if (shopId) {
          filtered = filtered.filter(o => o.shopId === shopId);
        }

        return filtered;
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onVillageChange(village: string) {
    this.selectedVillage$.next(village);
    this.selectedShopId$.next('');
    this.invoiceForm.patchValue({ shopId: '' });
  }

  onShopFilterChange(shopId: string) {
    this.selectedShopId$.next(shopId);
  }

  onShopSelect() {
    const shopId = this.invoiceForm.get('shopId')?.value;
    if (!shopId) return;

    this.shopService.getShops().pipe(take(1)).subscribe(shops => {
      const shop = shops.find(s => s.id === shopId);
      if (shop) {
        this.invoiceForm.patchValue({
          billedToName: shop.name,
          billedToAddress: shop.address,
          billedToPhone: shop.mobile,
          billedToGSTIN: shop.gstin,
          shippedToName: shop.name,
          shippedToAddress: shop.address,
          shippedToPhone: shop.mobile,
          shippedToGSTIN: shop.gstin,
        });
      }
    });
  }

  onOrderSelect(event: any) {
    const id = event.target.value;
    if (id === 'create-new') {
      this.initNewOrder();
    } else if (id) {
      this.isNewOrder = false;
      this.loadOrder(id);
    }
  }

  initNewOrder() {
    this.isNewOrder = true;
    this.order = {
      id: 'O' + Math.floor(Math.random() * 100000),
      invoiceNo: '' + Math.floor(Math.random() * 10000),
      shopId: 'MISC',
      date: new Date(),
      items: [],
      subTotal: 0,
      cgst: 0,
      sgst: 0,
      totalAmount: 0,
      status: 'Pending'
    };

    while (this.itemsFormArray.length) {
      this.itemsFormArray.removeAt(0);
    }

    this.invoiceForm.reset({
      invoiceNo: this.order.invoiceNo,
      date: new Date().toISOString().substring(0, 10),
      reverseCharge: 'No',
      paymentMode: 'Cash',
      vehicleNo: '',
      eWayBillNo: '',
      companyName: this.constants.COMPANY_NAME,
      companyGSTIN: this.constants.COMPANY_GSTIN,
      companyCell: this.constants.COMPANY_CELL,
      companyAddress: this.constants.COMPANY_ADDRESS,
      billedToName: '',
      billedToAddress: '',
      billedToPhone: '',
      billedToGSTIN: '',
      billedToState: '',
      billedToCode: '',
      shippedToName: '',
      shippedToAddress: '',
      shippedToPhone: '',
      shippedToGSTIN: '',
      shippedToState: 'ANDHRA PRADESH',
      shippedToCode: '37',
      bankAccNo: this.constants.COMPANY_BANK_ACC,
      bankIFSC: this.constants.COMPANY_BANK_IFSC,
      bankName: this.constants.COMPANY_BANK_NAME,
      totalBeforeTax: 0,
      cgst: 0,
      sgst: 0,
      taxAmount: 0,
      grandTotal: 0,
      rupeeInWords: ''
    });

    this.addItem({
      productId: '',
      productName: '',
      hsn: '',
      rate: 0,
      qty: 0,
      amount: 0
    });
  }

  loadOrder(id: string) {
    this.orderService.getOrders().pipe(take(1)).subscribe(orders => {
      const order = orders.find(o => o.id === id);
      if (order) {
        this.order = order;
        while (this.itemsFormArray.length) {
          this.itemsFormArray.removeAt(0);
        }
        order.items.forEach(item => this.addItem(item));

        this.invoiceForm.patchValue({
          invoiceNo: order.invoiceNo,
          date: new Date(order.date).toISOString().substring(0, 10),
          reverseCharge: order.reverseCharge || 'No',
          paymentMode: order.paymentMode || 'Cash',
          vehicleNo: order.vehicleNo || '',
          eWayBillNo: order.eWayBillNo || '',
          companyName: order.companyName || this.constants.COMPANY_NAME,
          companyGSTIN: order.companyGSTIN || this.constants.COMPANY_GSTIN,
          companyCell: order.companyCell || this.constants.COMPANY_CELL,
          companyAddress: order.companyAddress || this.constants.COMPANY_ADDRESS,
          billedToName: order.billedToName || '',
          billedToAddress: order.billedToAddress || '',
          billedToPhone: order.billedToPhone || '',
          billedToGSTIN: order.billedToGSTIN || '',
          billedToState: order.billedToState || '',
          billedToCode: order.billedToCode || '',
          shippedToName: order.shippedToName || '',
          shippedToAddress: order.shippedToAddress || '',
          shippedToPhone: order.shippedToPhone || '',
          shippedToGSTIN: order.shippedToGSTIN || '',
          shippedToState: order.shippedToState || '',
          shippedToCode: order.shippedToCode || '',
          bankAccNo: order.bankAccNo || this.constants.COMPANY_BANK_ACC,
          bankIFSC: order.bankIFSC || this.constants.COMPANY_BANK_IFSC,
          bankName: order.bankName || this.constants.COMPANY_BANK_NAME,
          totalBeforeTax: order.totalBeforeTax || order.subTotal,
          cgst: order.cgst,
          sgst: order.sgst,
          taxAmount: order.taxAmount || (order.cgst + order.sgst),
          grandTotal: order.grandTotal || order.totalAmount,
          rupeeInWords: order.rupeeInWords || ''
        });

        if (order.shopId) {
          this.shopService.getShops().pipe(take(1)).subscribe(shops => {
            const shop = shops.find(s => s.id === order.shopId);
            if (shop) {
              this.selectedVillage$.next(shop.village || 'Unknown');
              this.invoiceForm.patchValue({
                shippedToName: order.shippedToName || shop.name,
                shippedToAddress: order.shippedToAddress || shop.address,
                shippedToPhone: order.shippedToPhone || shop.mobile,
                shippedToGSTIN: order.shippedToGSTIN || shop.gstin,
                shippedToState: order.shippedToState || 'ANDHRA PRADESH',
                shippedToCode: order.shippedToCode || '37'
              });
            }
          });
        }
        this.updateCalculations();
      }
    });
  }

  addItem(item?: InvoiceItem) {
    const itemGroup = this.fb.group({
      productId: [item?.productId || ''],
      productName: [item?.productName || '', Validators.required],
      hsn: [item?.hsn || '3214', Validators.required],
      rate: [item?.rate || 0, [Validators.required, Validators.min(0)]],
      qty: [item?.qty !== undefined ? item.qty : 1, [Validators.required, Validators.min(0)]],
      amount: [item?.amount || 0]
    });
    this.itemsFormArray.push(itemGroup);
    this.updateCalculations();
  }

  removeItem(index: number) {
    this.itemsFormArray.removeAt(index);
    this.updateCalculations();
  }

  getAmount(index: number): number {
    const item = this.itemsFormArray.at(index).value;
    return (item.rate * item.qty) || 0;
  }

  updateCalculations() {
    let subtotal = 0;
    this.itemsFormArray.controls.forEach((control, index) => {
      const amount = this.getAmount(index);
      control.get('amount')?.setValue(amount, { emitEvent: false });
      subtotal += amount;
    });

    const taxRate = this.constants.DEFAULT_TAX_RATE / 100;
    const cgst = subtotal * taxRate;
    const sgst = subtotal * taxRate;
    const taxAmount = cgst + sgst;
    const grandTotal = subtotal + taxAmount;

    this.invoiceForm.patchValue({
      totalBeforeTax: Number(subtotal.toFixed(2)),
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
    }, { emitEvent: false });

    const rupeeInWordsControl = this.invoiceForm.get('rupeeInWords');
    if (rupeeInWordsControl && (!rupeeInWordsControl.value || rupeeInWordsControl.pristine)) {
      rupeeInWordsControl.setValue(this.constants.numberToWords(grandTotal), { emitEvent: false });
    }
  }


  onSubmit() {
    if (this.invoiceForm.valid && this.order) {
      this.spinner.show();
      const formVal = this.invoiceForm.value;
      const updatedOrder: Order = {
        ...this.order,
        ...formVal,
        date: new Date(formVal.date),
        subTotal: formVal.totalBeforeTax,
        totalAmount: formVal.grandTotal,
      };

      if (this.isNewOrder) {
        this.orderService.createOrder(updatedOrder);
      } else {
        this.orderService.updateOrder(updatedOrder);
      }

      setTimeout(() => {
        this.spinner.hide();
        Swal.fire({
          title: 'Invoice Updated!',
          text: 'The invoice has been saved successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: 'var(--card-bg)',
          color: 'var(--text-color)'
        }).then(() => {
          this.router.navigate(['/orders/invoice', (this.order as Order).id]);
        });
      }, 800);
    }
  }

  goBackToSelection() {
    this.order = undefined;
    this.isNewOrder = false;
    this.invoiceForm.reset();
    this.router.navigate(['/orders/edit-invoice']);
  }
}
