import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Injectable({
    providedIn: 'root'
})
export class ExportService {
    constructor() { }

    exportToPDF(title: string, headers: string[][], data: any[], filename: string) {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);

        const dateString = new Date().toLocaleDateString();
        doc.text(`Date: ${dateString}`, 14, 30);

        autoTable(doc, {
            head: headers,
            body: data,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [33, 150, 243] },
            styles: { fontSize: 8, cellPadding: 2 }
        });

        doc.save(`${filename}_${dateString}.pdf`);
    }

    exportToCSV(data: any[], filename: string) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, `${filename}_${new Date().toLocaleDateString()}.csv`);
    }
}
