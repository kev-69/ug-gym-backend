const { UniversityUser, PublicUser } = require('../models/User');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

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
      return res.status(201).json({ message: "Public user registered successfully", user });
    }

    // Handle University user registration
    const userExists = await UniversityUser.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await UniversityUser.create({
      firstName, lastName, email, phone, userType, universityId, hallOrDepartment, password: hashedPassword, medicalCondition
    });

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

    // Send the OTP to the user's email
    const message = `Your OTP code is ${otp}. It will expire in 1 hour.`;

    await sendEmail(user.email, 'Password Reset OTP', message);

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

module.exports = {
  registerUser,
  loginUniversityUser,
  loginPublicUser,
  getUserProfile,
  sendOtp,
  verifyOtp,
  resetPassword,
};
