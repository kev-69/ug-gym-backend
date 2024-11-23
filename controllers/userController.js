const { UniversityUser, PublicUser } = require('../models/User'); // Import both models
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Register a new user (University or Public)
const registerUser = async (req, res) => {
    const {
        firstName, lastName, email, phone, userType, password, universityId, hallOrDepartment, medicalCondition
    } = req.body;

    try {
        // Handle Public user registration
        if (userType === "public") {
            const userExists = await PublicUser.findOne({ email });
            if (userExists) return res.status(400).json({ message: "User already exists" });

            const user = await PublicUser.create({ firstName, lastName, email, phone, userType, password });
            return res.status(201).json({ message: "Public user registered successfully", userId: user.id });
        }

        // Handle University user registration
        if (userType === "student" || "staff") {
            const userExists = await UniversityUser.findOne({ email });
            if (userExists) return res.status(400).json({ message: "User already exists" });

            const user = await UniversityUser.create({
                firstName, lastName, email, phone, userType, universityId, hallOrDepartment, password, medicalCondition
            });
            return res.status(201).json({ message: "University user registered successfully", userId: user.id });
        }

        // Handle invalid user type
        return res.status(400).json({ message: "Invalid user type" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login a user (University or Public)
const loginUser = async (req, res) => {
    const { userType, email, universityId, password } = req.body;

    try {
        let user;
        // Handle Public user login
        if (userType === "public") {
            user = await PublicUser.findOne({ email });
            if (!user) return res.status(400).json({ message: "Invalid email or password" });
        }

        // Handle University user login
        if (userType === "student" || "staff") {
            user = await UniversityUser.findOne({ universityId });
            if (!user) return res.status(400).json({ message: "Invalid university ID or password" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_KEY, { expiresIn: "30d" });

        res.status(200).json({ message: "Login was successful", token });
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
        if (userType === "student" || "staff") {
            user = await UniversityUser.findById(req.user.id).select("-password");
        }

        // If no user found, return an error
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile
};