import Invoice from "../models/invoice.model.js";

export const createInvoice = async (req, res) => {
  try {
    const { customerId, productDetails ,invoiceNumber} = req.body;

    if ( !productDetails || !Array.isArray(productDetails) || !invoiceNumber) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // Calculate total amount
    const totalAmount = productDetails.reduce(
      (acc, item) => acc + item.amount,
      0
    );

    const newInvoice = new Invoice({
      customerId,
      productDetails,
      totalAmount,
      invoiceNumber
    });

    await newInvoice.save();

    res.status(201).json({ message: "Invoice created successfully", id: newInvoice._id });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const generateInvoiceNumber = async (req, res) => {
  try {
    // Find the last created invoice (sorted by creation time)
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 }).lean();

    let nextNumber = 1;

    if (lastInvoice && lastInvoice.invoiceNumber) {
      // Extract numeric part from previous invoice number
      const lastNum = parseInt(lastInvoice.invoiceNumber.replace("INV-", ""), 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    // Pad with zeros (e.g. INV-0005)
    const newInvoiceNumber = `INV-${nextNumber.toString().padStart(4, "0")}`;

    return res.status(200).json({ invoiceNumber: newInvoiceNumber });
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};