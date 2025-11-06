import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    GSTno: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/, // 10-digit mobile number
    },
    margin: {
      type: Number,
      required: true,
      min: 0,
    },
     isDeleted: {
      type: Boolean,
      default: false, //  for soft delete
    },
  },
  { timestamps: true }
);

export const Customer = mongoose.model("Customer", customerSchema);
