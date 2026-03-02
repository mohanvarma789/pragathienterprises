import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { Product } from '../../../core/models/models';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { ClickableImageDirective } from '../../../shared/directives/clickable-image.directive';

@Component({
  selector: 'app-add-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClickableImageDirective],
  templateUrl: './add-stock.component.html',
  styleUrls: ['./add-stock.component.css']
})
export class AddStockComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  product?: Product;
  quantity: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit() {
    this.spinner.show();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.inventoryService.getProductById(id).pipe(take(1), takeUntil(this.destroy$)).subscribe({
          next: (product) => {
            this.product = product;
            this.spinner.hide();
          },
          error: (err) => {
            this.spinner.hide();
            this.router.navigate(['/inventory']);
          }
        });
      } else {
        this.spinner.hide();
        this.router.navigate(['/inventory']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  preventNegativeQuantity(event: any) {
    const input = event.target;
    if (input.value < 0) {
      input.value = 0;
      this.quantity = 0;
      Swal.fire({
        title: 'Invalid Quantity!',
        text: 'Quantity cannot be negative. Value has been reset to 0.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
        background: 'var(--card-bg)',
        color: 'var(--text-color)'
      });
    }
  }

  submit() {
    if (this.product && this.quantity && this.quantity > 0) {
      this.spinner.show();
      this.inventoryService.addStock(this.product.id, this.quantity);

      setTimeout(() => {
        this.spinner.hide();
        Swal.fire({
          title: 'Stock Updated!',
          text: `${this.quantity} units added to ${this.product!.name}`,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#2196f3',
          background: 'var(--card-bg)',
          color: 'var(--text-color)'
        }).then(() => {
          this.router.navigate(['/inventory']);
        });
      }, 500);
    }
  }
}
