import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { ExportService } from '../../../core/services/export.service';
import { Product } from '../../../core/models/models';
import { Observable, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { Params } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { ClickableImageDirective } from '../../../shared/directives/clickable-image.directive';

@Component({
  selector: 'app-view-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClickableImageDirective],
  templateUrl: './view-products.component.html',
  styleUrls: ['./view-products.component.css']
})
export class ViewProductsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  searchTerm = '';
  showExportDropdown = false;
  private searchTermSubject = new BehaviorSubject<string>('');
  filteredProducts$: Observable<Product[]>;

  constructor(
    private inventoryService: InventoryService,
    private exportService: ExportService,
    private route: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {
    this.filteredProducts$ = combineLatest([
      this.inventoryService.getProducts(),
      this.searchTermSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.route.queryParams
    ]).pipe(
      takeUntil(this.destroy$),
      map(([products, term, params]: [Product[], string, Params]) => {
        const lowerTerm = term.toLowerCase();
        let filtered = products.filter((p: Product) =>
          p.name.toLowerCase().includes(lowerTerm)
        );

        if (params['filter'] === 'low-stock') {
          filtered = filtered.filter((p: Product) => p.stock < 21);
        } else if (params['filter'] === 'in-stock') {
          filtered = filtered.filter((p: Product) => p.stock >= 21);
        } else if (params['filter'] === 'out-of-stock') {
          filtered = filtered.filter((p: Product) => p.stock <= 0);
        }

        return filtered;
      })
    );
  }

  ngOnInit() {
    this.spinner.show();
    this.inventoryService.getProducts().pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
      this.spinner.hide();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(term: string) {
    this.searchTermSubject.next(term);
  }

  updateFilter(event: any) {
    const filterValue = event.target.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: filterValue || null },
      queryParamsHandling: 'merge'
    });
  }

  toggleDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
  }

  deleteProduct(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this product? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2196f3',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--card-bg)',
      color: 'var(--text-color)'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.inventoryService.deleteProduct(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.spinner.hide();
            Swal.fire({
              title: 'Deleted!',
              text: 'Product has been removed from inventory.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
              background: 'var(--card-bg)',
              color: 'var(--text-color)'
            });
          },
          error: (err) => {
            this.spinner.hide();
            Swal.fire({
              title: 'Error!',
              text: 'Failed to delete product. Please try again.',
              icon: 'error',
              confirmButtonColor: '#ef4444',
              background: 'var(--card-bg)',
              color: 'var(--text-color)'
            });
            console.error('Error deleting product:', err);
          }
        });
      }
    });
  }

  exportPDF() {
    this.filteredProducts$.pipe(take(1)).subscribe(products => {
      if (!products.length) return;
      const headers = [['Sl. No', 'Product Name', 'Price', 'Stock Status', 'Stock Count']];
      const tableData = products.map((p, i) => [
        i + 1,
        p.name,
        `Rs. ${p.price}`,
        p.stock <= 0 ? 'Out of Stock' : p.stock < 21 ? 'Low Stock' : 'In Stock',
        p.stock
      ]);
      this.exportService.exportToPDF('Inventory Report', headers, tableData, 'Inventory_Report');
    });
  }

  exportExcel() {
    this.filteredProducts$.pipe(take(1)).subscribe(products => {
      if (!products.length) return;
      const data = products.map((p, i) => ({
        'Sl. No': i + 1,
        'Product Name': p.name,
        'Price': p.price,
        'Stock Status': p.stock <= 0 ? 'Out of Stock' : p.stock < 21 ? 'Low Stock' : 'In Stock',
        'Stock Count': p.stock
      }));
      this.exportService.exportToCSV(data, 'Inventory_Report');
    });
  }

  navigateToAddStock(id: string) {
    this.router.navigate(['/inventory/add-stock', id]);
  }
}
