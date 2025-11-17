import express from "express";
import {
  createInvoice,
  generateInvoiceNumber,
} from "../controller/invoiceController.js";
import Invoice from "../models/invoice.model.js";
import { Customer } from "../models/customer.model.js";

const invoiceRouter = express.Router();

invoiceRouter.post("/create", createInvoice);
invoiceRouter.get("/", generateInvoiceNumber);
/*
  @route   POST /invoice/getAll
  @desc    Get all invoices with pagination, search, filter
  @access  Public
*/
invoiceRouter.post("/getAll", async (req, res) => {
  try {
    const { start = 0, limit = 10, filter, search } = req.body;

    // ----------- Build Query ----------------
    const query = {};

    // Filter by paymentStatus
    if (filter) {
      query["paymentData.paymentStatus"] = filter;
    }

    // Search by invoiceNumber OR customerName
    let customerIds = [];

    if (search) {
      const customers = await Customer.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      customerIds = customers.map((c) => c._id);

      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { customerId: { $in: customerIds } },
      ];
    }

    // ----------- Fetch Invoices ----------------
    const totalCount = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const invoices = await Invoice.find(query)
      .populate("customerId", "name")
      .populate("productDetails.productId", "name price")
      .skip(start)
      .limit(limit)
      .sort({ createdAt: -1 });

    // ----------- Format Response ----------------
    const totalAmount = invoices.reduce(
      (total, inv) => total + (inv.totalAmount || 0),
      0
    );
    const paidAmount = invoices.reduce(
      (total, inv) => total + (inv.paymentData?.paidAmount || 0),
      0
    );
    const formattedData = invoices.map((inv) => {
        const totalDiscount=inv.productDetails.reduce((total,p)=>{return total+p.disc},0)
      return {
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        customerDetails: {
          customerId: inv.customerId?._id || null,
          customerName: inv.customerId?.name || "Walk-in Customer",
        },
        productDetails: {
          productId: inv.productDetails[0]?.productId || "",
          amount: inv.totalAmount,
          gstAmount:inv.totalAmount*0.18,
          totalDiscount:inv.totalAmount*(totalDiscount/100),
          modeOfPayment: inv.paymentData?.modeOfPayment || null,
          paymentStatus: inv.paymentData?.paymentStatus || null,
          paidAmount: inv.paymentData?.paidAmount,
        },
        date: inv.createdAt
      };
    });

    return res.json({
      data: formattedData,
      totalAmount:totalAmount?.toFixed(2),
      totalPaidAmount:paidAmount?.toFixed(2),
      metaData: { totalPages },
    });
  } catch (error) {
    console.error("Error loading invoices:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});
export default invoiceRouter;
