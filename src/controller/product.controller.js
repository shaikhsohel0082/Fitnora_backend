import { Product } from "../models/product.model.js";

// Create product
export const createProduct = async (req, res) => {
  try {
    const { name, description, contents, benefits, price, unit } = req.body;

    const newProduct = new Product({
      name,
      description,
      contents,
      benefits: benefits ? JSON.parse(benefits) : [],
      price: price ? JSON.parse(price) : [],
      unit: unit ? JSON.parse(unit) : [],
      image: req.file ? `/uploads/${req.file.filename}` : null, // store image path
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all products (non-deleted)
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json(products);
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
