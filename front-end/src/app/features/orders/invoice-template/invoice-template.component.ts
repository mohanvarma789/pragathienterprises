import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { OrderService } from '../../../core/services/order.service';
import { Order, Shop } from '../../../core/models/models';
import { takeUntil, take } from 'rxjs/operators';
import { Subject } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ConstantsService } from '../../../core/services/constants.service';
import { AmountInWordsPipe } from '../../../shared/pipes/formatters.pipe';

@Component({
    selector: 'app-invoice-template',
    standalone: true,
    imports: [CommonModule, RouterModule, AmountInWordsPipe],
    templateUrl: './invoice-template.component.html',
    styleUrls: ['./invoice-template.component.css']
})
export class InvoiceTemplateComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    order: Order | undefined;
    shop: Shop | undefined;
    pages: any[][] = [];

    constructor(
        private route: ActivatedRoute,
        private orderService: OrderService,
        private shopService: ShopService,
        public constants: ConstantsService
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.orderService.getOrders().pipe(
                take(1),
                takeUntil(this.destroy$)
            ).subscribe(orders => {
                const o = orders.find(ord => ord.id === id);
                if (o) {
                    this.order = o;
                    this.shopService.getShopById(o.shopId).pipe(
                        take(1),
                        takeUntil(this.destroy$)
                    ).subscribe(s => this.shop = s);

                    this.pages = [];
                    const chunkSize = 8;
                    if (this.order.items && this.order.items.length > 0) {
                        for (let i = 0; i < this.order.items.length; i += chunkSize) {
                            this.pages.push(this.order.items.slice(i, i + chunkSize));
                        }
                    } else {
                        this.pages.push([]);
                    }
                }
            });
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getEmptyRows(itemCount: number) {
        const maxRows = 8;
        return new Array(Math.max(0, maxRows - itemCount));
    }

    printInvoice() {
        window.print();
    }

    downloadPdf() {
        if (!this.order) return;

        const elements = document.querySelectorAll('.invoice-paper');
        if (elements.length === 0) return;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;

        let processedCount = 0;

        elements.forEach((element: any, index) => {
            html2canvas(element as HTMLElement, { scale: 2, useCORS: true }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');

                if (index > 0) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);

                processedCount++;
                if (processedCount === elements.length) {
                    pdf.save(`Invoice_${this.order?.invoiceNo}.pdf`);
                }
            });
        });
    }
}
