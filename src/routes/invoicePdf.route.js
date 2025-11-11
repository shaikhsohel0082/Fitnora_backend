import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Invoice from "../models/invoice.model.js";

const pdfRouter = express.Router();

/**
 * Configuration Constants
 */
const PAGE_MARGIN = 40;
const RIGHT_MARGIN = 550;
const LINE_HEIGHT = 15;

/**
 * GET /api/invoices/:id/pdf
 * Generates a printable invoice PDF (A4 layout)
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

    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
    });

    const filePath = path.join(
      process.cwd(),
      `invoice_${invoice.invoiceNumber}_${Date.now()}.pdf`
    );
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    let currentY = PAGE_MARGIN;

    // [Company Details, Header, Customer Details, and Table Code Omitted for Brevity - No Changes Here]
    // =========================
    // COMPANY DETAILS SECTION
    // =========================
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, PAGE_MARGIN, currentY, { width: 80 });
    } else {
      doc.rect(PAGE_MARGIN, currentY, 80, 50).stroke();
      doc.fontSize(8).text("LOGO", PAGE_MARGIN + 25, currentY + 20);
    }

    doc.fontSize(16).text("Fitnora Global Pvt. Ltd.", 140, currentY + 10);
    doc
      .fontSize(10)
      .text(
        "Senapati Bapat Road, Pune , Maharashtra - 411016",
        140,
        currentY + 30
      )
      .text("GSTIN: 27ABCDE1234F1Z5", 140, currentY + 45)
      .text(
        "Phone: +91 9834012163 | Email: fitnoraglobal@gmail.com",
        140,
        currentY + 60
      );

    currentY += 80;
    doc.moveTo(PAGE_MARGIN, currentY).lineTo(RIGHT_MARGIN, currentY).stroke();
    currentY += 20;

    // =========================
    // INVOICE HEADER & CUSTOMER DETAILS
    // =========================
    doc.fontSize(14).text("TAX INVOICE", 0, currentY, { align: "center" });
    currentY += 30;

    const headerY = currentY;

    // Left Column (Invoice Info)
    doc
      .fontSize(10)
      .text(`Invoice No: ${invoice.invoiceNumber}`, PAGE_MARGIN, headerY)
      .text(
        `Date: ${new Date(invoice.createdAt).toLocaleDateString()}`,
        PAGE_MARGIN,
        headerY + LINE_HEIGHT
      );

    // Right Column (Customer Details)
    if (invoice.customerId) {
      const c = invoice.customerId;
      const billToX = 350;

      doc
        .fontSize(10)
        .text("Bill To:", billToX, headerY, { underline: true })
        .text(`Name: ${c.name || ""}`, billToX, headerY + LINE_HEIGHT)
        .text(`Address: ${c.address || ""}`, billToX, headerY + 2 * LINE_HEIGHT)
        .text(`City: ${c.city || ""}`, billToX, headerY + 3 * LINE_HEIGHT)
        .text(
          `GSTIN: ${c.gstNumber || "N/A"}`,
          billToX,
          headerY + 4 * LINE_HEIGHT
        );
    }

    currentY = headerY + 5 * LINE_HEIGHT + 10;
    doc.moveTo(PAGE_MARGIN, currentY).lineTo(RIGHT_MARGIN, currentY).stroke();
    currentY += 20;

    // =========================
    // TABLE HEADER
    // =========================
    const tableTop = currentY;
    const colWidths = [170, 40, 60, 40, 60, 70];
    const colX = [
      PAGE_MARGIN,
      PAGE_MARGIN + colWidths[0],
      PAGE_MARGIN + colWidths[0] + colWidths[1],
      PAGE_MARGIN + colWidths[0] + colWidths[1] + colWidths[2],
      PAGE_MARGIN + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
      PAGE_MARGIN +
        colWidths[0] +
        colWidths[1] +
        colWidths[2] +
        colWidths[3] +
        colWidths[4],
    ];

    doc.fontSize(10).font("Helvetica-Bold");

    doc.text("Product", colX[0], tableTop, { width: colWidths[0] });
    doc.text("Qty", colX[1], tableTop, {
      width: colWidths[1],
      align: "center",
    });
    doc.text("Rate", colX[2], tableTop, {
      width: colWidths[2],
      align: "right",
    });
    doc.text("Disc", colX[3], tableTop, {
      width: colWidths[3],
      align: "center",
    });
    doc.text("MRP", colX[4], tableTop, { width: colWidths[4], align: "right" });
    doc.text("Amount", colX[5], tableTop, {
      width: colWidths[5],
      align: "right",
    });

    currentY = tableTop + LINE_HEIGHT;
    doc.moveTo(PAGE_MARGIN, currentY).lineTo(RIGHT_MARGIN, currentY).stroke();
    currentY += 5;

    // =========================
    // TABLE ROWS
    // =========================
    doc.font("Helvetica");

    invoice.productDetails.forEach((p, i) => {
      if (currentY + LINE_HEIGHT > doc.page.height - PAGE_MARGIN) {
        doc.addPage();
        currentY = PAGE_MARGIN;
      }

      const productName = p.productId?.name || "Product Name Missing";

      doc.text(`${i + 1}. ${productName}`, colX[0], currentY, {
        width: colWidths[0],
      });
      doc.text(p.qty.toString(), colX[1], currentY, {
        width: colWidths[1],
        align: "center",
      });
      doc.text(p.rate.toFixed(2), colX[2], currentY, {
        width: colWidths[2],
        align: "right",
      });
      doc.text(`${p.disc}%`, colX[3], currentY, {
        width: colWidths[3],
        align: "center",
      });
      doc.text(p.mrp.toFixed(2), colX[4], currentY, {
        width: colWidths[4],
        align: "right",
      });
      doc.text(p.amount.toFixed(2), colX[5], currentY, {
        width: colWidths[5],
        align: "right",
      });

      currentY += LINE_HEIGHT + 5;
    });

    doc.moveTo(PAGE_MARGIN, currentY).lineTo(RIGHT_MARGIN, currentY).stroke();
    currentY += 20;

    // =========================
    // TOTAL SECTION
    // =========================
    doc.font("Helvetica-Bold");

    // ⭐ FIX: Change ₹ to "Rs."
    doc.text(
      `Total Amount: Rs.${invoice.totalAmount.toFixed(2)}`,
      PAGE_MARGIN,
      currentY,
      {
        width: RIGHT_MARGIN - PAGE_MARGIN,
        align: "right",
      }
    );
    currentY += 30;

    // =========================
    // PAYMENT DETAILS
    // =========================
    if (invoice.paymentData) {
      doc.font("Helvetica-Bold").text("Payment Details", PAGE_MARGIN, currentY);
      currentY += LINE_HEIGHT;

      doc.font("Helvetica");
      doc.text(
        `Mode of Payment: ${invoice.paymentData.modeOfPayment}`,
        PAGE_MARGIN,
        currentY
      );
      currentY += LINE_HEIGHT;
      doc.text(
        `Status: ${invoice.paymentData.paymentStatus}`,
        PAGE_MARGIN,
        currentY
      );
      currentY += LINE_HEIGHT;
      const paidText = `Paid Amount: Rs.${invoice.paymentData.paidAmount.toFixed(
        2
      )}`;
      doc.text(paidText, PAGE_MARGIN, currentY);
      currentY += LINE_HEIGHT;
      const pendingAmount =
        Number(invoice.totalAmount) - Number(invoice.paymentData.paidAmount);
      const pendingText = `Pending Amount: Rs.${pendingAmount.toFixed(2)}`;
      doc.text(pendingText, PAGE_MARGIN, currentY);
      currentY += LINE_HEIGHT;

      currentY += LINE_HEIGHT + 15;
    }

    // =========================
    // FOOTER
    // =========================
    if (currentY + 60 > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      currentY = PAGE_MARGIN;
    }

    doc.moveTo(PAGE_MARGIN, currentY).lineTo(RIGHT_MARGIN, currentY).stroke();
    currentY += 10;

    doc.fontSize(9).font("Helvetica-Oblique");
    doc.text("Thank you for your business!", 0, currentY, { align: "center" });
    currentY += 12;
    doc.text("This is a system-generated invoice.", 0, currentY, {
      align: "center",
    });

    // =========================
    // SEND PDF RESPONSE
    // =========================
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
