const express = require("express");
const {
    registerUser,
    loginUniversityUser,
    loginPublicUser,
    getUserProfile,
} = require("../controllers/userController");
const router = express.Router();

// Routes
router.post("/register", registerUser);
router.post("/login", loginUniversityUser);
router.post("/login", loginPublicUser);
router.get("/profile", getUserProfile);

module.exports = router;
