const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin, getAllUsers } = require("../controllers/adminController");
const { protect, verifyAdmin } = require("../middlewares/authMiddleware");


// Routes
// route to register admin user
router.post("/register", registerAdmin);
// route to login admin user
router.post("/login", loginAdmin);
// route to get all users
router.get("/all-users", protect, verifyAdmin, getAllUsers)

module.exports = router;