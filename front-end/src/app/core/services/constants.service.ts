import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ConstantsService {
    // Business Rules
    public readonly DEFAULT_TAX_RATE = 9; // CGST and SGST
    public readonly LOW_STOCK_THRESHOLD = 20;
    public readonly DEFAULT_HSN = '3214';

    // Branding & Company Info
    public readonly COMPANY_NAME = 'PRAGATHI ENTERPRISES';
    public readonly COMPANY_ADDRESS = 'Door No.9-55/c, T.P Gudem Road, MARTERU-534122, W.G.D.T, (A.P)';
    public readonly COMPANY_GSTIN = '37BRGPK4149CZV';
    public readonly COMPANY_CELL = '9701028499';
    public readonly COMPANY_BANK_NAME = 'UNION BANK OF INDIA';
    public readonly COMPANY_BANK_ACC = '613601010050075';
    public readonly COMPANY_BANK_IFSC = 'UBIN0561360';

    // Pagination Defaults
    public readonly DEFAULT_PAGE_SIZE = 50;

    constructor() { }

    public numberToWords(num: number): string {
        if (!num || num <= 0) return '';
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (val: number): string => {
            const s = val.toString();
            if (s.length > 9) return 'overflow';
            const match = ('000000000' + s).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!match) return '';

            let str = '';
            str += (Number(match[1]) !== 0) ? (a[Number(match[1])] || b[Number(match[1][0])] + ' ' + a[Number(match[1][1])]) + 'Crore ' : '';
            str += (Number(match[2]) !== 0) ? (a[Number(match[2])] || b[Number(match[2][0])] + ' ' + a[Number(match[2][1])]) + 'Lakh ' : '';
            str += (Number(match[3]) !== 0) ? (a[Number(match[3])] || b[Number(match[3][0])] + ' ' + a[Number(match[3][1])]) + 'Thousand ' : '';
            str += (Number(match[4]) !== 0) ? (a[Number(match[4])] || b[Number(match[4][0])] + ' ' + a[Number(match[4][1])]) + 'Hundred ' : '';
            str += (Number(match[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(match[5])] || b[Number(match[5][0])] + ' ' + a[Number(match[5][1])]) : '';
            return str;
        };

        const n = Math.floor(num);
        const p = Math.round((num - n) * 100);
        let res = inWords(n) + 'Rupees ';
        if (p > 0) res += 'and ' + inWords(p) + 'Paise ';
        return res + 'Only';
    }
}
