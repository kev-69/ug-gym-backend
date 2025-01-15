const { UniversityUser, PublicUser } = require('../models/User');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const multer = require('multer');
const path = require('path');
const cloudinary = require("../config/cloudinary")

// Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });
// const upload = multer({ storage });

// Register a new user (University or Public)
const registerUser = async (req, res) => {
  const {
    firstName, lastName, email, phone, userType, password, universityId, hallOrDepartment, medicalCondition
  } = req.body;

  try {
    // Validate userType
    if (!["public", "student", "staff"].includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle Public user registration
    if (userType === "public") {
      const userExists = await PublicUser.findOne({ email });
      if (userExists) return res.status(400).json({ message: "User already exists" });

      const user = await PublicUser.create({
        firstName, lastName, email, phone, userType, password: hashedPassword
      });

      // Generate membership ID using the first 8 characters of the user's _id
      user.membershipId = user._id.toString().slice(0, 8);
      await user.save();

      return res.status(201).json({ message: "Public user registered successfully", user });
    }

    // Handle University user registration
    const userExists = await UniversityUser.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await UniversityUser.create({
      firstName, lastName, email, phone, userType, universityId, hallOrDepartment, password: hashedPassword, medicalCondition
    });

    // Generate membership ID using the first 8 characters of the user's _id
    user.membershipId = user._id.toString().slice(0, 8);
    await user.save();

    return res.status(201).json({ message: "University user registered successfully", user});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login a university user
const loginUniversityUser = async (req, res) => {
  const { userType, universityId, password } = req.body;

  try {
    if (!["student", "staff"].includes(userType)) {
      return res.status(400).json({ message: "Invalid user type for university login" });
    }

    const user = await UniversityUser.findOne({ universityId });
    if (!user) return res.status(400).json({ message: "Invalid university ID or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid university ID or password" });

    const token = jwt.sign({ id: user.id, userType: user.userType }, process.env.JWT_KEY, { expiresIn: "30d" });

    res.status(200).json({ message: "University login successful", token, user });
    // console.log("Password from request:", password);
    // console.log("Hashed password in DB:", user.password);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login a public user
const loginPublicUser = async (req, res) => {
  const { userType, email, password } = req.body;

  try {
    if (userType !== "public") {
      return res.status(400).json({ message: "Invalid user type for public login" });
    }

    const user = await PublicUser.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid university ID or password" });

    const token = jwt.sign({ id: user.id, userType: user.userType }, process.env.JWT_KEY, { expiresIn: "30d" });

    res.status(200).json({ message: "Public login successful", token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  const { userType } = req.user;
  if (!userType) {
    return res.status(400).json({ message: "Invalid user type" });
  }

  try {
    let user;

    // Fetch Public user profile
    if (userType === "public") {
      user = await PublicUser.findById(req.user.id).select("-password");
    }

    // Fetch University user profile (either student or staff)
    if (userType === "student" || userType === "staff") {
      user = await UniversityUser.findById(req.user.id).select("-password");
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send OTP for password reset
const sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UniversityUser.findOne({ email }) || await PublicUser.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Hash the OTP and set it to the user's otp field
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Customize the email message using the Tailwind CSS template
    const htmlMessage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100">
        <div class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mt-10">
          <!-- Icon -->
          <div class="flex justify-center">
            <img src="https://img.icons8.com/ios-filled/50/000000/email-open.png" alt="Email Icon" class="mb-4">
          </div>

          <!-- Title -->
          <h2 class="text-center text-xl font-semibold text-gray-800 mb-4">Password Reset</h2>

          <!-- Lock Icon -->
          <div class="flex justify-center">
            <div class="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <img src="https://img.icons8.com/material-rounded/48/000000/lock.png" alt="Lock Icon">
            </div>
          </div>

          <!-- Message -->
          <p class="text-gray-700 text-center mb-6">
            Hello ${user.firstName},
            <br>
            Someone requested that the password for your SaaS account be reset.
          </p>

          <!-- Reset OTP -->
          <div class="flex justify-center mb-6">
            <span href="#" class="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700">
              ${otp}
            </span>
          </div>

          <!-- Info -->
          <p class="text-sm text-gray-600 text-center mb-4">
            If you didn't request this, you can ignore this email or let us know. Your password won't change until you create a new password.
          </p>

          <!-- Footer -->
          <div class="text-center text-gray-500 text-sm border-t pt-4">
            <p>© 2025 University of Ghana Gym, Inc. All rights reserved.</p>
            <p>Legon Boundary, Accra, 23321 GHANA, 030 221 3850</p>
            <p><a href="#" class="text-blue-600 hover:underline">unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the OTP to the user's email
    const message = `Your OTP code is ${otp}. It will expire in 1 hour.`;

    await sendEmail(user.email, 'Password Reset OTP', message, htmlMessage);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP for password reset
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await UniversityUser.findOne({ email }) || await PublicUser.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the OTP and compare it with the stored hashed OTP
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    console.log('Provided OTP:', otp);
    console.log('Hashed OTP:', hashedOtp);
    console.log('Stored Hashed OTP:', user.otp);
    console.log('OTP Expiry Time:', user.otpExpires);

    if (hashedOtp !== user.otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP is valid, clear the OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await UniversityUser.findOne({ email }) || await PublicUser.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate ID card information
const generateId = async (req, res) => {
  const { _id } = req.body;

  try {
    const user = await UniversityUser.findOne({ _id }) || await PublicUser.findOne({ _id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const idCardInfo = {
      passportPhoto: user.passportPhoto,
      membershipId: user.membershipId,
      firstName: user.firstName,
      lastName: user.lastName,
      subscription: {
        package: user.subscription.package,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
      },
    };

    res.status(200).json({ message: "ID card information generated successfully", idCardInfo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user's passport photo
const updatePassportPhoto = async (req, res) => {
  const userId = req.user.id; // Assuming you have middleware to set req.user
  const passportPhoto = req.file.path;

  try {
    // Upload the photo to Cloudinary
    const result = await cloudinary.uploader.upload(passportPhoto, {
      folder: 'passport_photos',
    });

    const user = await UniversityUser.findById(userId) || await PublicUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.passportPhoto = result.secure_url;
    await user.save();

    res.status(200).json({ message: "Passport photo updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUniversityUser,
  loginPublicUser,
  getUserProfile,
  sendOtp,
  verifyOtp,
  resetPassword,
  generateId,
  updatePassportPhoto,
};
