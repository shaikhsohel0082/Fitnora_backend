import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getAllCustomersV2,
} from "../controller/customer.controller.js";

const customerRoute = express.Router();

customerRoute.post("/", createCustomer);
customerRoute.get("/", getAllCustomers);
customerRoute.post("/getAll", getAllCustomersV2);
customerRoute.get("/:id", getCustomerById);
customerRoute.put("/:id", updateCustomer);
customerRoute.delete("/:id", deleteCustomer);

export default customerRoute;
