import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import customerRoute from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import invoiceRouter from "./routes/invoiceRoutes.js";
import pdfRouter from "./routes/invoicePdf.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
// MongoDB Connection
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Routes

//customer
app.use("/api/customers", customerRoute);

//product
app.use("/api/products", productRoutes);

//invoice
app.use("/api/invoice", invoiceRouter);

app.use("/api/pdf",pdfRouter)
// Default Route
app.get("/", (req, res) => res.send("Server Running "));

app.listen(PORT, () =>
  console.log(`Server started on http://localhost:${PORT}`)
);
