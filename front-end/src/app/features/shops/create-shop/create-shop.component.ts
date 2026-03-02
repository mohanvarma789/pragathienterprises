import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { Shop } from '../../../core/models/models';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-shop',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-shop.component.html',
  styleUrls: ['./create-shop.component.css']
})
export class CreateShopComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  shopForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {
    this.shopForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      address: ['', Validators.required],
      village: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      district: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      gstin: ['', [Validators.required, Validators.pattern('^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')]]
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  allowOnlyLetters(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
    this.shopForm.get(input.getAttribute('formControlName'))?.setValue(input.value);
  }

  allowOnlyNumbers(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.shopForm.get(input.getAttribute('formControlName'))?.setValue(input.value);
  }

  formatGSTIN(event: any) {
    const input = event.target;
    let value = input.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');
    input.value = value;
    this.shopForm.get('gstin')?.setValue(value);
  }

  onSubmit() {
    if (this.shopForm.valid) {
      this.spinner.show();
      const formValue = this.shopForm.value;
      const newShop: Shop = {
        ...formValue,
        id: 'S' + Math.floor(Math.random() * 10000),
        isActive: true
      };

      this.shopService.addShop(newShop);

      setTimeout(() => {
        this.spinner.hide();
        Swal.fire({
          title: 'Success!',
          text: 'Shop created successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: 'var(--card-bg)',
          color: 'var(--text-color)'
        }).then(() => {
          this.router.navigate(['/shops']);
        });
      }, 800);
    }
  }

  resetForm() {
    this.spinner.show();
    setTimeout(() => {
      this.shopForm.reset({
        name: '',
        address: '',
        village: '',
        district: '',
        pincode: '',
        mobile: '',
        gstin: ''
      });
      this.spinner.hide();
    }, 300);
  }
}
