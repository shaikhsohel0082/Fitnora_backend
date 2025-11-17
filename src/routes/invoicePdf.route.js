import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Invoice from "../models/invoice.model.js";

const pdfRouter = express.Router();

/**
 * Layout Constants
 */
const PAGE_MARGIN = 40;
const RIGHT_MARGIN = 550;
const LINE_HEIGHT = 14;

/**
 * Draw Company Header Section (Only for Copy 1)
 */
const drawCompanySection = (doc, y) => {
  const logoPath = path.join(process.cwd(), "public", "logo.png");

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, PAGE_MARGIN, y, { width: 70 });
  } else {
    doc.rect(PAGE_MARGIN, y, 70, 50).stroke();
    doc.fontSize(7).text("LOGO", PAGE_MARGIN + 25, y + 18);
  }

  doc.fontSize(13).text("Fitnora Global Pvt. Ltd.", 130, y + 5);
  doc
    .fontSize(9)
    .text("Senapati Bapat Road, Pune , Maharashtra - 411016", 130, y + 22)
    .text("GSTIN: 27ABCDE1234F1Z5", 130, y + 35)
    .text(
      "Phone: +91 9834012163 | Email: fitnoraglobal@gmail.com",
      130,
      y + 48
    );

  return y + 70;
};

/**
 * Draw Invoice Header + Customer Details
 */
const drawInvoiceHeader = (doc, y, invoice) => {
  doc.fontSize(14).text("TAX INVOICE", 0, y, { align: "center" });
  y += 25;
  doc.moveTo(PAGE_MARGIN, y).lineTo(RIGHT_MARGIN, y).stroke();
  y += 5;
  const leftY = y;

  doc.fontSize(10);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, PAGE_MARGIN, leftY);
  doc.text(
    `Date: ${new Date(invoice.createdAt).toLocaleDateString()}`,
    PAGE_MARGIN,
    leftY + LINE_HEIGHT
  );

  if (invoice.customerId) {
    const c = invoice.customerId;
    const cx = 330;

    doc
      .fontSize(10)
      .text("Bill To:", cx, leftY, { underline: true })
      .text(`Name: ${c.name || ""}`, cx, leftY + LINE_HEIGHT)
      .text(`Address: ${c.address || ""}`, cx, leftY + LINE_HEIGHT * 2)
      .text(`City: ${c.city || ""}`, cx, leftY + LINE_HEIGHT * 3)
      .text(`GSTIN: ${c.gstNumber || "N/A"}`, cx, leftY + LINE_HEIGHT * 4);
  }

  y = leftY + LINE_HEIGHT * 5 + 8;
  doc.moveTo(PAGE_MARGIN, y).lineTo(RIGHT_MARGIN, y).stroke();

  return y + 12;
};

/**
 * Draw Product Table (Fixed Column Overlap)
 */
const drawProductTable = (doc, y, invoice) => {
  // Updated better spaced column widths

  const tableTop = doc.y + 20;
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Product", 40, tableTop);
  doc.text("Qty", 300, tableTop);
  doc.text("Disc", 350, tableTop);
  doc.text("MRP", 400, tableTop);
  doc.text("Rate", 450, tableTop);
  doc.text("Amount", 490, tableTop);

  y += LINE_HEIGHT;
  doc.moveTo(PAGE_MARGIN, y).lineTo(RIGHT_MARGIN, y).stroke();
  y += 5;

  doc.font("Helvetica").fontSize(10);

  invoice.productDetails.forEach((p, i) => {
    doc.font("Helvetica").fontSize(10);
    const productName = p.productId?.name || "Product Name Missing";
    doc.text(
      `${i + 1}. ${
        productName.length > 12
          ? productName?.slice(0, 10) + "..."
          : productName
      } - ${p.unit} (gm)`,
      40,
      y
    );
    doc.text(`${p.qty}`, 300, y);
    doc.text(`${p.disc}%`, 350, y);
    doc.text(`${p.mrp.toFixed(2)}`, 400, y);
    doc.text(`${p.rate.toFixed(2)}`, 450, y);
    doc.text(`${p.amount.toFixed(2)}`, 490, y);

    y += 20;
  });

  doc.moveTo(PAGE_MARGIN, y).lineTo(RIGHT_MARGIN, y).stroke();

  return y + 15;
};

/**
 * Draw Total Section
 */
const drawTotals = (doc, y, invoice) => {
  doc.font("Helvetica").fontSize(10);
  const gst=invoice.totalAmount.toFixed(2) * 0.18
 doc.text(
    `Total GST @18%: Rs.${gst.toFixed(2)}`,
    PAGE_MARGIN,
    y,
    { width: RIGHT_MARGIN - PAGE_MARGIN, align: "right" }
  );
  y+=20
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text(
    `Total Amount: Rs.${invoice.totalAmount.toFixed(2)}`,
    PAGE_MARGIN,
    y,
    { width: RIGHT_MARGIN - PAGE_MARGIN, align: "right" }
  );
y += 20;
  doc.font("Helvetica").fontSize(10);

  if (invoice.paymentData) {
    doc.text("Payment Details", PAGE_MARGIN, y);
    y += LINE_HEIGHT;

    doc.text(
      `Mode of Payment: ${invoice.paymentData.modeOfPayment}`,
      PAGE_MARGIN,
      y
    );
    y += LINE_HEIGHT;

    doc.text(`Status: ${invoice.paymentData.paymentStatus}`, PAGE_MARGIN, y);
    y += LINE_HEIGHT;

    doc.text(
      `Paid Amount: Rs.${invoice.paymentData.paidAmount.toFixed(2)}`,
      PAGE_MARGIN,
      y
    );
    y += LINE_HEIGHT;

    const pending =
      Number(invoice.totalAmount) - Number(invoice.paymentData.paidAmount);

    doc.text(`Pending Amount: Rs.${pending.toFixed(2)}`, PAGE_MARGIN, y);
    y += LINE_HEIGHT;
  }

  return y + 20;
};

/**
 * Footer only for first copy
 */
const drawFooter = (doc, y) => {
  doc.moveTo(PAGE_MARGIN, y).lineTo(RIGHT_MARGIN, y).stroke();
  y += 10;

  doc.fontSize(9).font("Helvetica-Oblique");
  doc.text("Thank you! Order Again.", 0, y, { align: "center" });
  y += LINE_HEIGHT;
  doc.text("This is a system-generated invoice.", 0, y, {
    align: "center",
  });

  return y + 20;
};

/**
 * Generate FULL COPY 1
 */
const drawCopy1 = (doc, startY, invoice) => {
  let y = startY;

  y = drawCompanySection(doc, y);
  y = drawInvoiceHeader(doc, y, invoice);
  y = drawProductTable(doc, y, invoice);
  y = drawTotals(doc, y, invoice);
  y = drawFooter(doc, y);

  return y;
};

/**
 * Generate COPY 2 (No company details & No footer)
 */
const drawCopy2 = (doc, startY, invoice) => {
  let y = startY;

  y = drawInvoiceHeader(doc, y, invoice);
  y = drawProductTable(doc, y, invoice);
  y = drawTotals(doc, y, invoice);

  return y;
};

/**
 * Route: GET /api/invoices/:id/pdf
 */
pdfRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate("customerId")
      .populate("productDetails.productId")
      .lean();

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });

    const filePath = path.join(
      process.cwd(),
      `invoice_${invoice.invoiceNumber}_${Date.now()}.pdf`
    );

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    let y = PAGE_MARGIN;

    // FIRST COPY
    y = drawCopy1(doc, y, invoice);

    // Separator
    doc.moveTo(PAGE_MARGIN, y).lineTo(RIGHT_MARGIN, y).stroke();
    y += 15;

    // SECOND COPY
    drawCopy2(doc, y, invoice);

    doc.end();

    writeStream.on("finish", () => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=${path.basename(filePath)}`
      );

      fs.createReadStream(filePath)
        .pipe(res)
        .on("end", () => fs.unlinkSync(filePath));
    });
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ message: "Error generating invoice PDF" });
  }
});

export default pdfRouter;
