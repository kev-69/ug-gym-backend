const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUniversityUser,
    loginPublicUser,
    getUserProfile,
} = require("../controllers/userController");

const { protect } = require("../middlewares/authMiddleware")
// console.log(typeof protect); // Should log "function"

// Routes
router.post("/register", registerUser);
// Separate the routes for university and public user login
router.post("/login/university", loginUniversityUser); // For university users (student or staff)
router.post("/login/public", loginPublicUser); // For public users
router.get("/profile", protect, getUserProfile);

module.exports = router;
