import Invoice from "../models/invoice.model.js";
import {Product} from "../models/product.model.js";
export const createInvoice = async (req, res) => {
  try {
    const { customerId, productDetails, invoiceNumber, paymentData } = req.body;

    if (!productDetails || !Array.isArray(productDetails) || !invoiceNumber) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // Calculate total amount
    const totalAmount = productDetails.reduce(
      (acc, item) => acc + item.amount,
      0
    );

    // Update all product stocks
    for (const item of productDetails) {
      // Fetch the product
      const product = await Product.findById(item.productId);

      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.productId}` });
      }

      // Calculate quantity usage in stock (your logic)
      const quantityToDeduct = (item.unit * item.qty) / 1000; // ✔ correct

      // Check stock availability
      if (product.stock < quantityToDeduct) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }

      // Deduct stock
      product.stock = product.stock - quantityToDeduct;

      // Save the product
      await product.save();
    }

    // Create invoice
    const newInvoice = new Invoice({
      customerId,
      productDetails,
      totalAmount,
      invoiceNumber,
      paymentData,
    });

    await newInvoice.save();

    res.status(201).json({
      message: "Invoice created successfully",
      id: newInvoice._id,
    });
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
      const lastNum = parseInt(
        lastInvoice.invoiceNumber.replace("INV-", ""),
        10
      );
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    // Pad with zeros (e.g. INV-0005)
    const newInvoiceNumber = `INV-${nextNumber.toString().padStart(4, "0")}`;

    return res.status(200).json({ invoiceNumber: newInvoiceNumber });
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
export const updateInvoice = async (req, res) => {
  try {
    const { id, paidAmount, paymentStatus } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    // Check invoice existence
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Update fields
    invoice.paymentData.paidAmount =
      paidAmount ?? invoice.paymentData.paidAmount;
    invoice.paymentData.paymentStatus =
      paymentStatus ?? invoice.paymentData.paymentStatus;

    await invoice.save();

    return res.status(200).json({
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
