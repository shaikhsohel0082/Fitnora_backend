import { Customer } from "../models/customer.model.js";

// Create new customer
export const createCustomer = async (req, res) => {
  try {
    const { name, address, GSTno, mobileNumber, margin } = req.body;

    if (!name || !address || !GSTno || !mobileNumber || margin == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingCustomer = await Customer.findOne({ GSTno });
    if (existingCustomer) {
      return res
        .status(400)
        .json({ message: "Customer with this GST already exists" });
    }

    const customer = await Customer.create({
      name,
      address,
      GSTno,
      mobileNumber,
      margin,
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all customers (excluding deleted)
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get single customer by ID (only if not deleted)
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update customer (only if not deleted)
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true }
    );
    if (!customer)
      return res.status(404).json({ message: "Customer not found or deleted" });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Soft delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({ message: "Customer soft deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
