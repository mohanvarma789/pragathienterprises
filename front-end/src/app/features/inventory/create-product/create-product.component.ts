import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { Product } from '../../../core/models/models';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  productForm: FormGroup;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      hsn: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      imageUrl: ['']
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.productForm.patchValue({ imageUrl: this.imagePreview });
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.productForm.patchValue({ imageUrl: '' });
  }

  preventNegativeStock(event: any) {
    const input = event.target;
    if (input.value < 0) {
      input.value = 0;
      this.productForm.patchValue({ stock: 0 });
      Swal.fire({
        title: 'Invalid Stock!',
        text: 'Stock cannot be negative. Value has been reset to 0.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
        background: 'var(--card-bg)',
        color: 'var(--text-color)'
      });
    }
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.spinner.show();
      const formValue = this.productForm.value;
      const newProduct: Product = {
        id: 'P' + Math.floor(Math.random() * 10000),
        ...formValue
      };

      this.inventoryService.addProduct(newProduct).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.spinner.hide();
          Swal.fire({
            title: 'Success!',
            text: 'Product created successfully',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
          }).then(() => {
            this.router.navigate(['/inventory']);
          });
        },
        error: (err) => {
          this.spinner.hide();
          Swal.fire({
            title: 'Error!',
            text: 'Failed to create product. Please try again.',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
          });
          console.error('Error creating product:', err);
        }
      });
    }
  }

  resetForm() {
    this.spinner.show();
    setTimeout(() => {
      this.productForm.reset({
        name: '',
        hsn: '',
        price: 0,
        stock: 0,
        imageUrl: ''
      });
      this.imagePreview = null;
      this.spinner.hide();
    }, 300);
  }
}
