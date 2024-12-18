const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin } = require("../controllers/adminController");

// Routes
// route to register admin user
router.post("/register", registerAdmin);
// route to login admin user
router.post("/login", loginAdmin);

module.exports = router;