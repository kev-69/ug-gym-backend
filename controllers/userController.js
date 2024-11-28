const { UniversityUser, PublicUser } = require('../models/User');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
      return res.status(201).json({ message: "Public user registered successfully", userId: user.id });
    }

    // Handle University user registration
    const userExists = await UniversityUser.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await UniversityUser.create({
      firstName, lastName, email, phone, userType, universityId, hallOrDepartment, password: hashedPassword, medicalCondition
    });

    return res.status(201).json({ message: "University user registered successfully", userId: user.id });
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
  const { userType } = req.query; // Determine the user type from query or token payload

  try {
    let user;

    // Fetch Public user profile
    if (userType === "public") {
      user = await PublicUser.findById(req.user.id).select("-password");
    }

    // Fetch University user profile
    if (userType === "student" || userType === "staff") {
      user = await UniversityUser.findById(req.user.id).select("-password");
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUniversityUser,
  loginPublicUser,
  getUserProfile
};
