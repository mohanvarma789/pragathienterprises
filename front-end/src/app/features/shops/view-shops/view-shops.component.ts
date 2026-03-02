import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { ExportService } from '../../../core/services/export.service';
import { Shop } from '../../../core/models/models';
import { Observable, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-view-shops',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './view-shops.component.html',
  styleUrls: ['./view-shops.component.css']
})
export class ViewShopsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  searchTerm = '';
  selectedVillage = '';
  showExportDropdown = false;
  private searchTermSubject = new BehaviorSubject<string>('');
  private villageFilterSubject = new BehaviorSubject<string>('');
  filteredShops$: Observable<Shop[]>;
  villages$: Observable<string[]>;

  constructor(
    private shopService: ShopService,
    private exportService: ExportService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {
    this.villages$ = this.shopService.getShops().pipe(
      takeUntil(this.destroy$),
      map(shops => Array.from(new Set(shops.map(s => s.village))).sort())
    );

    this.filteredShops$ = combineLatest([
      this.shopService.getShops(),
      this.searchTermSubject,
      this.villageFilterSubject
    ]).pipe(
      takeUntil(this.destroy$),
      map(([shops, term, village]) => {
        const lowerTerm = term.toLowerCase();
        return shops.filter(s => {
          const matchesSearch = s.name.toLowerCase().includes(lowerTerm) ||
            s.district.toLowerCase().includes(lowerTerm) ||
            s.mobile.includes(term) ||
            s.gstin.toLowerCase().includes(lowerTerm) ||
            s.village.toLowerCase().includes(lowerTerm);

          const matchesVillage = !village || s.village === village;
          return matchesSearch && matchesVillage;
        });
      })
    );
  }

  ngOnInit() {
    this.spinner.show();
    this.shopService.getShops().pipe(take(1), takeUntil(this.destroy$)).subscribe(() => {
      this.spinner.hide();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToEditShop(id: string) {
    this.router.navigate(['/shops/edit', id]);
  }

  onSearch(term: string) {
    this.searchTermSubject.next(term);
  }

  onVillageFilter(village: string) {
    this.villageFilterSubject.next(village);
  }

  toggleDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
  }

  deleteShop(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this shop? This action cannot be undone.',
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
        this.shopService.deleteShop(id);
        setTimeout(() => {
          this.spinner.hide();
          Swal.fire({
            title: 'Deleted!',
            text: 'Shop has been deleted.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
          });
        }, 800);
      }
    });
  }

  toggleStatus(id: string) {
    this.spinner.show();
    this.shopService.toggleStatus(id);
    setTimeout(() => this.spinner.hide(), 500);
  }

  exportPDF() {
    this.filteredShops$.pipe(take(1)).subscribe(shops => {
      if (!shops.length) return;
      const headers = [['Sl. No', 'Shop Name', 'Village/Town', 'District', 'Mobile', 'GSTIN', 'Status']];
      const tableData = shops.map((s, i) => [
        i + 1,
        s.name,
        s.village,
        s.district,
        s.mobile,
        s.gstin,
        s.isActive ? 'Active' : 'Inactive'
      ]);
      this.exportService.exportToPDF('Shop List Report', headers, tableData, 'Shop_List_Report');
    });
  }

  exportExcel() {
    this.filteredShops$.pipe(take(1)).subscribe(shops => {
      if (!shops.length) return;
      const data = shops.map((s, i) => ({
        'Sl. No': i + 1,
        'Shop Name': s.name,
        'Village/Town': s.village,
        'District': s.district,
        'Mobile': s.mobile,
        'GSTIN': s.gstin,
        'Status': s.isActive ? 'Active' : 'Inactive'
      }));
      this.exportService.exportToCSV(data, 'Shop_List_Report');
    });
  }
}
