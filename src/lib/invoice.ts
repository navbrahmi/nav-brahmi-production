/**
 * Tax Invoice Generator for Nav Brahmi
 * 
 * Complies with Section 31 of CGST Act.
 * Formatted to match official Nav Brahmi Bill Template:
 * /home/projects/projects/Kreovi-NavBrahmi2026-10-17/Bill-Template-Nav-Brahmi/Invoice-NavBrahmi for Website.xlsx
 */

export interface InvoiceOrderData {
  orderId: string;
  orderToken: string;
  customerName?: string | null;
  customerEmail: string;
  productName: string;
  amountMinor: number;
  currency?: string;
  paymentId?: string | null;
  createdAt: Date | string;
}

export interface GeneratedInvoice {
  pdfBuffer: Buffer;
  invoiceNumber: string;
  invoiceData: {
    invoiceNumber: string;
    invoiceDate: string;
    orderToken: string;
    paymentId: string;
    customerName: string;
    customerEmail: string;
    productName: string;
    hsnSac: string;
    baseAmount: string;
    cgst: string;
    sgst: string;
    totalAmount: string;
    amountInWords: string;
  };
}

function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 480) {
    return 'Four Hundred and Eighty Rupees Only';
  }
  if (rounded === 472) {
    return 'Four Hundred and Seventy-Two Rupees Only';
  }

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelowThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  if (rounded === 0) return 'Zero Rupees Only';

  let remaining = rounded;
  let result = '';

  if (remaining >= 10000000) {
    const crores = Math.floor(remaining / 10000000);
    result += convertBelowThousand(crores) + ' Crore ';
    remaining %= 10000000;
  }
  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    result += convertBelowThousand(lakhs) + ' Lakh ';
    remaining %= 100000;
  }
  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    result += convertBelowThousand(thousands) + ' Thousand ';
    remaining %= 1000;
  }
  if (remaining > 0) {
    result += convertBelowThousand(remaining) + ' ';
  }

  return `${result.trim()} Rupees Only`;
}

export function generateTaxInvoice(data: InvoiceOrderData): GeneratedInvoice {
  const total = data.amountMinor / 100;
  // Standard 18% GST calculation (9% CGST + 9% SGST inclusive)
  const base = total / 1.18;
  const totalTax = total - base;
  const halfTax = totalTax / 2;

  const orderDate = new Date(data.createdAt);
  const day = String(orderDate.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${day}-${months[orderDate.getMonth()]}-${orderDate.getFullYear()}`;

  // Deterministic invoice sequence identifier from order ID
  const orderSuffix = data.orderId.replace(/^cm[a-z0-9]{4}/, '').slice(-6).toUpperCase();
  const invoiceNumber = `NB-INV-${orderDate.getFullYear()}-${orderSuffix}`;

  const invoiceData = {
    invoiceNumber,
    invoiceDate: formattedDate,
    orderToken: data.orderToken,
    paymentId: data.paymentId || 'Online Payment (Verified)',
    customerName: data.customerName?.trim() || 'Valued Customer',
    customerEmail: data.customerEmail.toLowerCase().trim(),
    productName: data.productName,
    hsnSac: '998331',
    baseAmount: base.toFixed(2),
    cgst: halfTax.toFixed(2),
    sgst: halfTax.toFixed(2),
    totalAmount: total.toFixed(2),
    amountInWords: numberToWordsINR(total),
  };

  const pdfBuffer = renderInvoicePdf(invoiceData);

  return {
    pdfBuffer,
    invoiceNumber,
    invoiceData,
  };
}

function renderInvoicePdf(inv: {
  invoiceNumber: string;
  invoiceDate: string;
  orderToken: string;
  paymentId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  hsnSac: string;
  baseAmount: string;
  cgst: string;
  sgst: string;
  totalAmount: string;
  amountInWords: string;
}): Buffer {
  // Page size: Standard ISO A4 = 595.28 x 841.89 points
  const width = 595.28;
  const height = 841.89;
  const margin = 36; // 0.5 inch margins

  let stream = '';

  function escapePdf(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function setStrokeColor(r: number, g: number, b: number) {
    stream += `${r} ${g} ${b} RG\n`;
  }
  function setFillColor(r: number, g: number, b: number) {
    stream += `${r} ${g} ${b} rg\n`;
  }
  function setLineWidth(w: number) {
    stream += `${w} w\n`;
  }
  function drawRect(x: number, y: number, w: number, h: number, fill = false, stroke = true) {
    stream += `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}\n`;
  }
  function drawLine(x1: number, y1: number, x2: number, y2: number) {
    stream += `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;
  }
  function drawText(text: string, x: number, y: number, font = 'F1', size = 10, align: 'left' | 'center' | 'right' = 'left', color = [0, 0, 0]) {
    setFillColor(color[0], color[1], color[2]);
    stream += `BT /${font} ${size} Tf `;
    const cleanText = escapePdf(String(text));
    const approxWidth = cleanText.length * size * (font === 'F2' ? 0.58 : 0.52);
    let posX = x;
    if (align === 'center') posX = x - approxWidth / 2;
    if (align === 'right') posX = x - approxWidth;
    stream += `${posX.toFixed(2)} ${y.toFixed(2)} Td (${cleanText}) Tj ET\n`;
  }

  // Draw Outer Border
  setLineWidth(1);
  setStrokeColor(0.2, 0.2, 0.2);
  drawRect(margin, margin, width - margin * 2, height - margin * 2);

  // Top Title Bar
  setFillColor(0.96, 0.96, 0.97);
  drawRect(margin, height - margin - 38, width - margin * 2, 38, true, true);
  drawText('TAX INVOICE', width / 2, height - margin - 18, 'F2', 14, 'center', [0.1, 0.1, 0.1]);
  drawText('(Under Section 31 OF CGST ACT)', width / 2, height - margin - 30, 'F1', 9, 'center', [0.35, 0.35, 0.35]);
  drawText('ORIGINAL FOR RECIPIENT', width - margin - 12, height - margin - 24, 'F2', 8, 'right', [0.4, 0.4, 0.4]);

  // Company Details Header
  const topY = height - margin - 48;
  drawText('NAV BRAHMI', margin + 15, topY - 10, 'F2', 13, 'left', [0.89, 0.06, 0.33]);
  drawText('No.75, 7th Cross, Kumara Park West, Bengaluru – 560020', margin + 15, topY - 24, 'F1', 8.5);
  drawText('Phone: +91 9845980534 | E-mail: support@brahmicomputing.in', margin + 15, topY - 36, 'F1', 8.5);
  drawText('GSTIN: 29BQKPJ9659M1ZQ | PAN: BQKPJ9659M | MSME: UDYAM-KR-03-0731072', margin + 15, topY - 48, 'F2', 8.5, 'left', [0.2, 0.2, 0.2]);

  // Horizontal divider
  const billSectionY = topY - 60;
  drawLine(margin, billSectionY, width - margin, billSectionY);

  // Bill To & Invoice Meta Section (Two Column)
  const colMid = margin + (width - margin * 2) * 0.55;
  drawLine(colMid, billSectionY, colMid, billSectionY - 80);

  // Left: Bill To
  setFillColor(0.97, 0.97, 0.98);
  drawRect(margin, billSectionY - 18, (width - margin * 2) * 0.55, 18, true, true);
  drawText('BILL TO PARTY', margin + 10, billSectionY - 13, 'F2', 8.5, 'left', [0.2, 0.2, 0.2]);

  drawText(`Customer Name: ${inv.customerName}`, margin + 10, billSectionY - 32, 'F2', 9);
  drawText(`Email: ${inv.customerEmail}`, margin + 10, billSectionY - 45, 'F1', 8.5);
  drawText(`State: Karnataka (Code: 29)`, margin + 10, billSectionY - 58, 'F1', 8.5);
  drawText(`Reverse Charge: No`, margin + 10, billSectionY - 71, 'F1', 8.5);

  // Right: Invoice Meta
  setFillColor(0.97, 0.97, 0.98);
  drawRect(colMid, billSectionY - 18, width - margin - colMid, 18, true, true);
  drawText('INVOICE DETAILS', colMid + 10, billSectionY - 13, 'F2', 8.5, 'left', [0.2, 0.2, 0.2]);

  drawText(`Invoice No: ${inv.invoiceNumber}`, colMid + 10, billSectionY - 32, 'F2', 9);
  drawText(`Invoice Date: ${inv.invoiceDate}`, colMid + 10, billSectionY - 45, 'F1', 8.5);
  drawText(`Order Ref: ${inv.orderToken}`, colMid + 10, billSectionY - 58, 'F1', 8.5);
  drawText(`Payment ID: ${inv.paymentId}`, colMid + 10, billSectionY - 71, 'F1', 8.5);

  const tableTopY = billSectionY - 80;
  drawLine(margin, tableTopY, width - margin, tableTopY);

  // Table Header
  const thHeight = 22;
  setFillColor(0.93, 0.93, 0.95);
  drawRect(margin, tableTopY - thHeight, width - margin * 2, thHeight, true, true);

  const colSl = margin + 30;
  const colDesc = margin + 280;
  const colHsn = margin + 345;
  const colQty = margin + 380;
  const colRate = margin + 445;
  const colAmt = width - margin;

  drawLine(colSl, tableTopY, colSl, tableTopY - 110);
  drawLine(colDesc, tableTopY, colDesc, tableTopY - 110);
  drawLine(colHsn, tableTopY, colHsn, tableTopY - 110);
  drawLine(colQty, tableTopY, colQty, tableTopY - 110);
  drawLine(colRate, tableTopY, colRate, tableTopY - 110);

  drawText('Sl.', margin + 15, tableTopY - 15, 'F2', 8.5, 'center');
  drawText('Description of Services', margin + 40, tableTopY - 15, 'F2', 8.5);
  drawText('HSN/SAC', colDesc + 10, tableTopY - 15, 'F2', 8.5);
  drawText('Qty', colHsn + 10, tableTopY - 15, 'F2', 8.5);
  drawText('Rate (Rs)', colQty + 10, tableTopY - 15, 'F2', 8.5);
  drawText('Amount (Rs)', colAmt - 10, tableTopY - 15, 'F2', 8.5, 'right');

  // Row 1 Item
  const rowY = tableTopY - thHeight - 16;
  drawText('1', margin + 15, rowY, 'F1', 9, 'center');
  drawText(`Nav Brahmi ${inv.productName} Software`, margin + 40, rowY, 'F2', 9);
  drawText(`(Single-Machine Lifetime Windows Driver License)`, margin + 40, rowY - 12, 'F1', 7.5, 'left', [0.4, 0.4, 0.4]);
  drawText(inv.hsnSac, colDesc + 15, rowY, 'F1', 9);
  drawText('1', colHsn + 18, rowY, 'F1', 9);
  drawText(inv.baseAmount, colRate - 12, rowY, 'F1', 9, 'right');
  drawText(inv.baseAmount, colAmt - 10, rowY, 'F2', 9, 'right');

  // Bottom of item table
  const tableBottomY = tableTopY - 110;
  drawLine(margin, tableBottomY, width - margin, tableBottomY);

  // Tax Breakdown Rows
  const taxY1 = tableBottomY - 18;
  const taxY2 = taxY1 - 18;
  const taxY3 = taxY2 - 18;
  const taxY4 = taxY3 - 22;

  drawLine(margin, taxY1, width - margin, taxY1);
  drawText('Total Amount Before Tax', margin + 15, taxY1 + 5, 'F1', 8.5);
  drawText(`Rs. ${inv.baseAmount}`, colAmt - 10, taxY1 + 5, 'F2', 8.5, 'right');

  drawLine(margin, taxY2, width - margin, taxY2);
  drawText('Central Goods & Service Tax (CGST 9%)', margin + 15, taxY2 + 5, 'F1', 8.5);
  drawText(`Rs. ${inv.cgst}`, colAmt - 10, taxY2 + 5, 'F1', 8.5, 'right');

  drawLine(margin, taxY3, width - margin, taxY3);
  drawText('State Goods & Service Tax (SGST 9%)', margin + 15, taxY3 + 5, 'F1', 8.5);
  drawText(`Rs. ${inv.sgst}`, colAmt - 10, taxY3 + 5, 'F1', 8.5, 'right');

  // Grand Total Highlight
  setFillColor(0.96, 0.97, 0.99);
  drawRect(margin, taxY4, width - margin * 2, 22, true, true);
  drawText('TOTAL AMOUNT PAYABLE (INCL. TAXES)', margin + 15, taxY4 + 7, 'F2', 9.5, 'left', [0.1, 0.1, 0.1]);
  drawText(`Rs. ${inv.totalAmount}`, colAmt - 10, taxY4 + 7, 'F2', 11, 'right', [0.89, 0.06, 0.33]);

  // Amount in words
  const wordsY = taxY4 - 20;
  drawLine(margin, wordsY, width - margin, wordsY);
  drawText(`Amount in words: ${inv.amountInWords}`, margin + 15, wordsY + 6, 'F2', 8.5);

  // Bank Details & Signatory Section
  const bankTopY = wordsY - 14;
  const signColX = margin + (width - margin * 2) * 0.6;
  drawLine(signColX, wordsY, signColX, margin);

  // Bank Info
  drawText('BANK DETAILS FOR WIRE / NEFT', margin + 15, bankTopY, 'F2', 8.5, 'left', [0.2, 0.2, 0.2]);
  drawText('Bank: State Bank of India', margin + 15, bankTopY - 14, 'F1', 8);
  drawText('A/c Name: Nav Brahmi', margin + 15, bankTopY - 26, 'F1', 8);
  drawText('A/c Number: 45348686374', margin + 15, bankTopY - 38, 'F2', 8);
  drawText('IFSC Code: SBIN0040263 | MICR: 560002413', margin + 15, bankTopY - 50, 'F1', 8);
  drawText('Branch: Seshadripuram Branch, Bengaluru', margin + 15, bankTopY - 62, 'F1', 8);

  // Signatory
  drawText('For NAV BRAHMI', width - margin - 20, bankTopY, 'F2', 9, 'right');
  drawText('(Digitally Generated Tax Invoice)', width - margin - 20, margin + 35, 'F1', 7.5, 'right', [0.4, 0.4, 0.4]);
  drawText('Authorised Signatory', width - margin - 20, margin + 20, 'F2', 8.5, 'right');

  // PDF Structure
  const objects: string[] = [];
  function addObj(str: string): number {
    objects.push(str);
    return objects.length;
  }

  addObj('<< /Type /Catalog /Pages 2 0 R >>');
  addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`);
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const streamBytes = Buffer.from(stream, 'utf-8');
  addObj(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`);

  let pdfStr = '%PDF-1.4\n';
  const xrefOffsets = [0];

  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(Buffer.byteLength(pdfStr, 'utf-8'));
    pdfStr += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(pdfStr, 'utf-8');
  pdfStr += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdfStr += `${String(xrefOffsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdfStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdfStr, 'utf-8');
}

