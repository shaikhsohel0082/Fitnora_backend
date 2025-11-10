import mongoose from "mongoose";

const productInvoiceSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    unit: { type: Number, required: true },
    mrp: { type: Number, required: true },
    rate: { type: Number, required: true },
    qty: { type: Number, required: true },
    disc: { type: Number, default: 0 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false, 
      default: null,
    },
    productDetails: {
      type: [productInvoiceSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
    },
    invoiceNumber: { type: String, unique: true, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
