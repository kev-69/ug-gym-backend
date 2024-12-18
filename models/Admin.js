const mongoose = require("mongoose");

// Admin Schema
const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
},
{ timestamps: true }
);

// Create models
const Admin = mongoose.model("admins", AdminSchema);

// Export models
module.exports = Admin;