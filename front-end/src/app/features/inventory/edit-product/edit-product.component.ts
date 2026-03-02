import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { Product } from '../../../core/models/models';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { ClickableImageDirective } from '../../../shared/directives/clickable-image.directive';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ClickableImageDirective],
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.css']
})
export class EditProductComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  productForm: FormGroup;
  productId: string | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private router: Router,
    private route: ActivatedRoute,
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

  ngOnInit() {
    this.spinner.show();
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.inventoryService.getProductById(this.productId).pipe(take(1), takeUntil(this.destroy$)).subscribe(product => {
        if (product) {
          this.productForm.patchValue(product);
          this.imagePreview = product.imageUrl || null;
          this.spinner.hide();
        } else {
          this.spinner.hide();
          this.router.navigate(['/inventory']);
        }
      });
    } else {
      this.spinner.hide();
      this.router.navigate(['/inventory']);
    }
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
        this.productForm.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.productForm.patchValue({ imageUrl: '' });
    this.productForm.markAsDirty();
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
    if (this.productForm.valid && this.productId) {
      this.spinner.show();
      const formValue = this.productForm.value;
      const updatedProduct: Product = {
        id: this.productId,
        ...formValue
      };

      this.inventoryService.updateProduct(updatedProduct).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.spinner.hide();
          Swal.fire({
            title: 'Success!',
            text: 'Product updated successfully',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#2196f3',
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
            text: 'Failed to update product. Please try again.',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
          });
          console.error('Error updating product:', err);
        }
      });
    }
  }
}
