import { Customer } from "../models/customer.model.js";

export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      pincode,
      gst,
      mobile,
      margin_percentage,
    } = req.body;

    // ✅ Basic validation
    if (
      !name ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !mobile ||
      margin_percentage == null
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // ✅ Check for existing GST (only if gst is provided)
    if (mobile) {
      const existingCustomer = await Customer.findOne({ mobile });
      if (existingCustomer) {
        return res
          .status(400)
          .json({ message: "Customer with same mobile already exists" });
      }
    }

    // ✅ Create new customer
    const customer = await Customer.create({
      name,
      address,
      city,
      state,
      pincode,
      gst,
      mobile,
      margin_percentage,
    });

    res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      message: "Server error while creating customer",
      error: error.message,
    });
  }
};

// // Get all customers (excluding deleted)
// export const getAllCustomers = async (req, res) => {
//   try {
//     const customers = await Customer.find({ isDeleted: false }).sort({
//       createdAt: -1,
//     });
//     res.status(200).json(customers);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

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



export const getAllCustomers = async (req, res) => {
  try {
    const {
      page_number = 1,
      page_size = 10,
      search = "",
    } = req.query;

    const page = parseInt(page_number);
    const limit = parseInt(page_size);
    const skip = (page - 1) * limit;

    // ✅ Search condition
    const searchQuery = {
      isDeleted: false,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ],
    };

    // ✅ Count total records
    const totalCustomers = await Customer.countDocuments(searchQuery);

    // ✅ Fetch paginated data
    const customers = await Customer.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // ✅ Transform data to include `id` instead of `_id`
    const formattedCustomers = customers.map((cust) => ({
      id: cust._id, // ✅ include MongoDB id
      name: cust.name,
      address: cust.address,
      city: cust.city,
      state: cust.state,
      pincode: cust.pincode,
      gst: cust.gst,
      mobile: cust.mobile,
      margin_percentage: cust.margin_percentage,
      createdAt: cust.createdAt,
      updatedAt: cust.updatedAt,
    }));

    res.status(200).json({
      success: true,
      total: totalCustomers,
      page,
      page_size: limit,
      total_pages: Math.ceil(totalCustomers / limit),
      customers: formattedCustomers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching customers",
      error: error.message,
    });
  }
};

export const getAllCustomersV2 = async (req, res) => {
  try {
    const { start = 0, limit = 10, searchTerm = "" } = req.body;

    // ✅ Search condition
    const searchQuery = {
      isDeleted: false,
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { city: { $regex: searchTerm, $options: "i" } },
        { state: { $regex: searchTerm, $options: "i" } },
        { mobile: { $regex: searchTerm, $options: "i" } },
      ],
    };

    // ✅ Count total matching records
    const totalCustomers = await Customer.countDocuments(searchQuery);

    // ✅ Fetch paginated data
    const customers = await Customer.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(limit);

    // ✅ Format response data
    const formattedCustomers = customers.map((cust) => ({
      id: cust._id,
      name: cust.name,
      address: cust.address,
      city: cust.city,
      state: cust.state,
      pincode: cust.pincode,
      gst: cust.gst,
      mobile: cust.mobile,
      margin_percentage: cust.margin_percentage,
      createdAt: cust.createdAt,
      updatedAt: cust.updatedAt,
    }));

    // ✅ Determine if there’s more data
    const hasMore = start + limit < totalCustomers;

    // ✅ Response structure aligned with frontend
    res.status(200).json({
      data: formattedCustomers,
      metaData: {
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      message: "Server error while fetching customers",
      error: error.message,
    });
  }
};
