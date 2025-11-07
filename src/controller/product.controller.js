import { Product } from "../models/product.model.js";

// Create product
export const createProduct = async (req, res) => {
  try {
    const { name, description, contents, benefits, unitMrpList,hsn_number } = req.body;

    const newProduct = new Product({
      name,
      description,
      contents,
      hsn_number,
      benefits: benefits ? JSON.parse(benefits) : [],
      unitMrpList: unitMrpList ? JSON.parse(unitMrpList) : [],
      image: req.file ? `/uploads/${req.file.filename}` : null, // store image path
    });

    await newProduct.save();   
    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all products (non-deleted)
// Get all products (non-deleted) with pagination & search
export const getAllProducts = async (req, res) => {
  try {
    const { page_number = 1, page_size = 10, search = "" } = req.query;

    const page = parseInt(page_number, 10);
    const limit = parseInt(page_size, 10);
    const skip = (page - 1) * limit;

    const query = {
      isDeleted: false,
      name: { $regex: search, $options: "i" },
    };

    const totalProducts = await Product.countDocuments(query);

    const productsData = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalProducts / limit);

    // ✅ Map _id to id for frontend
    const products = productsData.map((p) => ({
      id: p._id,
      name: p.name,
      description: p.description,
      contents: p.contents,
      benefits: p.benefits,
      unitMrpList: p.unitMrpList,
      image: p.image,
      hsn_number:p.hsn_number,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      stock:p.stock
    }));

    res.status(200).json({
      products,
      total_pages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  
  try {
    const { id } = req.params;
    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found or deleted" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Soft delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product soft deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
