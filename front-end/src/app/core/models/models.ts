export interface Shop {
  id: string;
  name: string;
  address: string;
  village: string; // Added for village/town filtering
  district: string;
  pincode: string;
  mobile: string;
  gstin: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  hsn: string; // Harmonized System of Nomenclature
  category?: string;
  type?: string;
  size?: string; // e.g., "4 inch", "9 inch"
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string; // Snapshot of name
  hsn: string; // Mock HSN code
  rate: number; // Snapshot of price
  qty: number;
  amount: number;
}

export interface Order {
  id: string;
  invoiceNo: string;
  shopId: string;
  date: Date;
  items: InvoiceItem[];
  subTotal: number;
  cgst: number; // calculated
  sgst: number; // calculated
  totalAmount: number;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Urgent';

  // Invoice Metadata
  vehicleNo?: string;
  eWayBillNo?: string;
  reverseCharge?: string;
  paymentMode?: string;

  // Comprehensive Branding & Details
  companyName?: string;
  companyGSTIN?: string;
  companyCell?: string;
  companyAddress?: string;

  // Receiver (Billed To)
  billedToName?: string;
  billedToAddress?: string;
  billedToPhone?: string;
  billedToGSTIN?: string;
  billedToState?: string;
  billedToCode?: string;

  // Consignee (Shipped To)
  shippedToName?: string;
  shippedToAddress?: string;
  shippedToPhone?: string;
  shippedToGSTIN?: string;
  shippedToState?: string;
  shippedToCode?: string;

  // Bank Details
  bankAccNo?: string;
  bankIFSC?: string;
  bankName?: string;

  // Totals & Words
  taxAmount?: number;
  totalBeforeTax?: number;
  totalAfterTax?: number;
  grandTotal?: number;
  rupeeInWords?: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Staff';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin?: string;
}
export interface Organization {
  id: string;
  name: string;
  gstin: string;
  establishedDate: string;
  mobile: string;
  email: string;
  address: string;
  logoUrl?: string;
}

export interface StockRequest {
  id: string;
  productId: string;
  shopId: string;
  targetOrderId?: string;
  requestedQty: number;
  status: 'Pending' | 'Fulfilled' | 'Converted'; // Converted = New Order created
  requestDate: Date;
  priority: 'Urgent' | 'Normal';
}
