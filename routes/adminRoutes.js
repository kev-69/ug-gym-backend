const express = require("express");
const router = express.Router();
const { 
    registerAdmin, 
    loginAdmin, 
    getAllUsers, 
    getUserDetails,
    updateUserStatus, 
} = require("../controllers/adminController");

const { protect, verifyAdmin } = require("../middlewares/authMiddleware");


// Routes
// route to register admin user
router.post("/register", registerAdmin);
// route to login admin user
router.post("/login", loginAdmin);
// route to get all users
router.get("/all-users", protect, verifyAdmin, getAllUsers)
// route to get user with user id
router.get("/users/:id", protect, verifyAdmin, getUserDetails)
// route to update user subscription
router.patch("/users/:id/status", protect, verifyAdmin, updateUserStatus);

module.exports = router;