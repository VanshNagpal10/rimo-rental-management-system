/**
 * PDF Invoice Generator
 * Generates professional invoices with order details and customer information
 */

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    landmark?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: Array<{
    name: string;
    duration: string;
    fromDate: string;
    toDate: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }>;
  pricing: {
    subtotal: number;
    discount?: number;
    discountAmount?: number;
    deliveryCharge: number;
    tax: number;
    total: number;
  };
  paymentMethod: string;
  deliveryMethod: string;
}

export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<void> => {
  try {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      throw new Error('PDF generation is only available in the browser');
    }

    // Dynamic import for client-side only
    const jsPDF = (await import('jspdf')).default;
    
    try {
      await import('jspdf-autotable');
    } catch (tableError) {
      console.warn('AutoTable not available, using simple layout');
    }
    
    // Create new PDF document
    const doc = new jsPDF();
  
  // Company/Brand Information
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(96, 64, 88); // Primary color #604058
  doc.text('RENTAL MANAGER', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Smart Rental Management System', 20, 32);
  
  // Invoice Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('INVOICE', 150, 25);
  
  // Invoice Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoiceData.orderNumber}`, 150, 35);
  doc.text(`Date: ${invoiceData.orderDate}`, 150, 42);
  
  // Customer Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.customerName, 20, 65);
  doc.text(invoiceData.customerEmail, 20, 72);
  if (invoiceData.customerPhone) {
    doc.text(invoiceData.customerPhone, 20, 79);
  }
  
  // Delivery Address
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Address:', 110, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const deliveryAddr = invoiceData.deliveryAddress;
  doc.text(deliveryAddr.street, 110, 65);
  doc.text(`${deliveryAddr.city}, ${deliveryAddr.state} ${deliveryAddr.zipCode}`, 110, 72);
  doc.text(deliveryAddr.country, 110, 79);
  if (deliveryAddr.landmark) {
    doc.text(`Landmark: ${deliveryAddr.landmark}`, 110, 86);
  }
  
  // Add line separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 95, 190, 95);
  
  // Items table
  const tableStartY = 105;
  
  // Prepare table data
  const tableData = invoiceData.items.map(item => [
    item.name,
    `${item.fromDate} to ${item.toDate}`,
    item.duration,
    item.quantity.toString(),
    `₹${item.pricePerUnit.toFixed(2)}`,
    `₹${item.totalPrice.toFixed(2)}`
  ]);
  
  // Create table (with fallback)
  let finalY = tableStartY + 20;
  
  if (typeof (doc as any).autoTable === 'function') {
    try {
      doc.autoTable({
        startY: tableStartY,
        head: [['Item', 'Rental Period', 'Duration', 'Qty', 'Rate', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [96, 64, 88], // Primary color
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        columnStyles: {
          0: { cellWidth: 45 }, // Item name
          1: { cellWidth: 45 }, // Rental period
          2: { cellWidth: 25 }, // Duration
          3: { cellWidth: 15 }, // Quantity
          4: { cellWidth: 25 }, // Rate
          5: { cellWidth: 25 }  // Amount
        },
        margin: { left: 20, right: 20 }
      });
      
      // Get final Y position after table
      finalY = (doc as any).lastAutoTable.finalY + 10;
    } catch (tableError) {
      console.warn('AutoTable failed, using simple text layout');
      finalY = tableStartY + (tableData.length * 10) + 30;
    }
  } else {
    // Simple text-based table fallback
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEMS:', 20, tableStartY);
    
    let yPos = tableStartY + 10;
    invoiceData.items.forEach((item, index) => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}. ${item.name}`, 20, yPos);
      doc.text(`Period: ${item.fromDate} to ${item.toDate}`, 30, yPos + 5);
      doc.text(`Qty: ${item.quantity} | Rate: ₹${item.pricePerUnit} | Amount: ₹${item.totalPrice}`, 30, yPos + 10);
      yPos += 20;
    });
    
    finalY = yPos + 10;
  }
  
  // Pricing summary
  const summaryStartX = 130;
  let summaryY = finalY;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.text('Subtotal:', summaryStartX, summaryY);
  doc.text(`₹${invoiceData.pricing.subtotal.toFixed(2)}`, 175, summaryY);
  summaryY += 7;
  
  // Discount (if applicable)
  if (invoiceData.pricing.discountAmount && invoiceData.pricing.discountAmount > 0) {
    doc.text(`Discount (${invoiceData.pricing.discount}%):`, summaryStartX, summaryY);
    doc.text(`-₹${invoiceData.pricing.discountAmount.toFixed(2)}`, 175, summaryY);
    summaryY += 7;
  }
  
  // Delivery charge
  doc.text('Delivery Charge:', summaryStartX, summaryY);
  doc.text(invoiceData.pricing.deliveryCharge > 0 ? `₹${invoiceData.pricing.deliveryCharge.toFixed(2)}` : 'FREE', 175, summaryY);
  summaryY += 7;
  
  // Tax
  doc.text('Tax:', summaryStartX, summaryY);
  doc.text(`₹${invoiceData.pricing.tax.toFixed(2)}`, 175, summaryY);
  summaryY += 7;
  
  // Total
  doc.setLineWidth(0.5);
  doc.line(summaryStartX, summaryY, 190, summaryY);
  summaryY += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', summaryStartX, summaryY);
  doc.text(`₹${invoiceData.pricing.total.toFixed(2)}`, 175, summaryY);
  
  // Payment and delivery info
  summaryY += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Payment Method: ${invoiceData.paymentMethod}`, 20, summaryY);
  doc.text(`Delivery Method: ${invoiceData.deliveryMethod}`, 20, summaryY + 7);
  
  // Footer
  const footerY = doc.internal.pageSize.height - 30;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for choosing Rental Manager!', 20, footerY);
  doc.text('For support, contact us at support@rentalmanager.com', 20, footerY + 5);
  
  // Add page border
  doc.setLineWidth(1);
  doc.setDrawColor(96, 64, 88);
  doc.rect(10, 10, 190, doc.internal.pageSize.height - 20);
  
  // Save the PDF
  const fileName = `Invoice_${invoiceData.orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF invoice');
  }
};

// Note: Quote PDF generation can be implemented later with async import pattern
