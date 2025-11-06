import mongoose from "mongoose";

const priceSchema = new mongoose.Schema(
  {
    unit: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    image: {
      type: String,
      required: true, // URL or path to image
    },
    description: {
      type: String,
      default: "",
    },
    contents: {
      type: String,
      default: "",
    },
    benefits: {
      type: [String],
      default: [],
    },
    price: {
      type: [priceSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one price entry is required",
      },
    },
    units: {
      type: [Number],
      default: [100, 500, 1000],
    },
    category: {
      type: String,
      default: "Muesli",
    },
    stock: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
