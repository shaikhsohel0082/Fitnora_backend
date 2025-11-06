import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    pincode: { // ✅ match frontend field name
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
    gst: {
      type: String,
      required: false,
      uppercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"],
      unique: true, 
      sparse: true, 
      trim: true,
    },
    margin_percentage: {
      type: String,
      required: [true, "Margin percentage is required"],
      min: [0, "Margin cannot be negative"],
    },
    isDeleted: {
      type: Boolean,
      default: false, // ✅ for soft delete
    },
  },
  { timestamps: true }
);

// Optional: auto-trim and format GST before saving
customerSchema.pre("save", function (next) {
  if (this.gst) {
    this.gst = this.gst.trim().toUpperCase();
  }
  next();
});

export const Customer = mongoose.model("Customer", customerSchema);
