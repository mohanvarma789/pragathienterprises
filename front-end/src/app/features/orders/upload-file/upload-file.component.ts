import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { InventoryService } from '../../../core/services/inventory.service';
import { ShopService } from '../../../core/services/shop.service';
import { ConstantsService } from '../../../core/services/constants.service';
import { Product, Shop } from '../../../core/models/models';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-upload-file',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './upload-file.component.html',
    styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent implements OnDestroy {
    private destroy$ = new Subject<void>();
    selectedFile: File | null = null;
    processing = false;
    message = '';
    success = false;

    constructor(
        private inventoryService: InventoryService,
        private shopService: ShopService,
        private constants: ConstantsService,
        private router: Router
    ) { }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer?.files.length) {
            this.selectedFile = event.dataTransfer.files[0];
            this.message = '';
        }
    }

    onFileSelected(event: any) {
        if (event.target.files.length) {
            this.selectedFile = event.target.files[0];
            this.message = '';
        }
    }

    upload() {
        if (!this.selectedFile) return;
        this.processing = true;
        this.message = '';

        const fileReader = new FileReader();

        fileReader.onload = (e: any) => {
            const arrayBuffer = e.target.result;
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length > 0) {
                this.processData(jsonData);
            } else {
                this.message = 'The file is empty or could not be parsed.';
                this.success = false;
                this.processing = false;
            }
        };

        fileReader.onerror = () => {
            this.message = 'Error reading file.';
            this.success = false;
            this.processing = false;
        };

        fileReader.readAsArrayBuffer(this.selectedFile);
    }

    processData(data: any[]) {
        const firstRow = data[0];
        if (firstRow['Product Name'] || firstRow['product name'] || firstRow['Price'] || firstRow['price']) {
            this.processProducts(data);
        } else if (firstRow['Shop Name'] || firstRow['shop name'] || firstRow['District'] || firstRow['district']) {
            this.processShops(data);
        } else {
            this.message = 'Could not determine data type. Please ensure headers match: "Product Name", "Price", "Initial Stock" OR "Shop Name", "District", etc.';
            this.success = false;
            this.processing = false;
        }
    }

    processProducts(data: any[]) {
        const products: any[] = data.map(row => ({
            name: row['Product Name'] || row['product name'] || 'Unknown Product',
            hsn: String(row['HSN'] || row['hsn'] || row['HSN Code'] || row['hsn code'] || this.constants.DEFAULT_HSN),
            price: Number(row['Price'] || row['price'] || 0),
            stock: Number(row['Initial Stock'] || row['initial stock'] || row['Stock'] || row['stock'] || 0),
            imageUrl: ''
        })).filter(p => p.name !== 'Unknown Product');

        this.inventoryService.addProducts(products as Product[])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.message = `Successfully imported ${products.length} products! Redirecting...`;
                    this.success = true;
                    setTimeout(() => this.router.navigate(['/inventory']), 1500);
                },
                error: (err) => {
                    this.message = `Bulk import failed: ${err.error?.error || err.message}`;
                    this.success = false;
                    this.processing = false;
                }
            });
    }

    processShops(data: any[]) {
        const shops: any[] = data.map(row => ({
            name: row['Shop Name'] || row['shop name'] || 'Unknown Shop',
            address: row['Address'] || row['address'] || '',
            village: row['Village'] || row['village'] || row['Town'] || row['town'] || '',
            district: row['District'] || row['district'] || 'Other',
            pincode: String(row['Pincode'] || row['pincode'] || ''),
            mobile: String(row['Mobile'] || row['mobile'] || ''),
            gstin: row['GSTIN'] || row['gstin'] || '',
            isActive: true
        })).filter(s => s.name !== 'Unknown Shop');

        this.shopService.addShops(shops as Shop[])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.message = `Successfully imported ${shops.length} shops! Redirecting...`;
                    this.success = true;
                    setTimeout(() => this.router.navigate(['/shops']), 1500);
                },
                error: (err) => {
                    this.message = `Bulk import failed: ${err.error?.error || err.message}`;
                    this.success = false;
                    this.processing = false;
                }
            });
    }
}
