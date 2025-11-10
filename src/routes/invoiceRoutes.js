import express from "express";
import { createInvoice, generateInvoiceNumber } from "../controller/invoiceController.js";


const invoiceRouter = express.Router();

invoiceRouter.post("/create", createInvoice);
invoiceRouter.get("/", generateInvoiceNumber);
export default invoiceRouter;
