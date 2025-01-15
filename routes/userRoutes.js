const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUniversityUser,
    loginPublicUser,
    getUserProfile,
    sendOtp,
    verifyOtp,
    resetPassword,
    generateId,
    updatePassportPhoto
} = require("../controllers/userController");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { protect } = require("../middlewares/authMiddleware")

// ROUTES
// http://localhost:4000/api/users/register --- POST
router.post("/register", registerUser);
// http://localhost:4000/api/users/login/university --- POST
router.post("/login/university", loginUniversityUser); // For university users (student or staff)
// http://localhost:4000/api/users/login/public --- POST
router.post("/login/public", loginPublicUser); // For public users
// http://localhost:4000/api/users/profile --- GET
router.get("/profile", protect, getUserProfile);
// http://localhost:4000/api/users/profile --- PATCH
router.patch('/profile', protect, upload.single('passportPhoto'), updatePassportPhoto);
// http://localhost:4000/api/users/generate-id --- GET
router.get("/generate-id", generateId)
// http://localhost:4000/api/users/send-otp --- POST
router.post("/send-otp", sendOtp);
// http://localhost:4000/api/users/verify-otp --- POST
router.post("/verify-otp", verifyOtp);
// http://localhost:4000/api/users/reset-password --- POST
router.post("/reset-password", resetPassword);

module.exports = router;
