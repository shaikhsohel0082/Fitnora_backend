import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controller/customer.controller.js";

const customerRoute = express.Router();

customerRoute.post("/create", createCustomer);
customerRoute.get("/", getAllCustomers);
customerRoute.get("/:id", getCustomerById);
customerRoute.put("/:id", updateCustomer);
customerRoute.delete("/:id", deleteCustomer);

export default customerRoute;
