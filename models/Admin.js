const mongoose = require("mongoose");

// Admin Schema
const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      default: "admin",
    }
},
{ timestamps: true }
);

// Create models
const Admin = mongoose.model("admins", AdminSchema);

// Export models
module.exports = Admin;