/**
 * Simple PDF Generator (Fallback)
 * Basic PDF generation without complex table features
 */

export const generateSimpleInvoicePDF = async (orderData: any, session: any): Promise<void> => {
  try {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      throw new Error('PDF generation is only available in the browser');
    }

    // Dynamic import for client-side only
    const jsPDF = (await import('jspdf')).default;
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL MANAGER INVOICE', 20, 20);
    
    // Order info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order #: ${orderData?.orderNumber || 'ORD-123456'}`, 20, 40);
    doc.text(`Date: ${orderData?.orderDate || new Date().toLocaleDateString()}`, 20, 50);
    
    // Customer info
    doc.text(`Customer: ${session?.user?.name || 'Customer Name'}`, 20, 70);
    doc.text(`Email: ${session?.user?.email || 'customer@example.com'}`, 20, 80);
    
    // Address
    if (orderData?.deliveryAddress) {
      doc.text('Delivery Address:', 20, 100);
      doc.text(orderData.deliveryAddress.street || 'Address', 20, 110);
      doc.text(`${orderData.deliveryAddress.city || 'City'}, ${orderData.deliveryAddress.state || 'State'}`, 20, 120);
    }
    
    // Items (simple list)
    doc.text('Items:', 20, 140);
    if (orderData?.items && orderData.items.length > 0) {
      orderData.items.forEach((item: any, index: number) => {
        const yPos = 150 + (index * 10);
        doc.text(`${index + 1}. ${item.name || 'Item'} - ₹${item.totalPrice || 0}`, 20, yPos);
      });
    } else {
      doc.text('No items found', 20, 150);
    }
    
    // Total
    const total = orderData?.pricing?.total || 0;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ₹${total}`, 20, 200);
    
    // Save
    const fileName = `Invoice_${orderData?.orderNumber || Date.now()}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('Error generating simple PDF:', error);
    throw new Error('Failed to generate PDF invoice');
  }
};
