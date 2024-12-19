const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { PublicUser, UniversityUser } = require("../models/User")

// Register Admin
const registerAdmin = async (req, res) => {
    const {
        name,
        email,
        password,
        userType,
    } = req.body

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await Admin.create({
            name, email, password: hashedPassword, userType,
        })
        return res.status(201).json({ message: "Admin successfully registered", user })
    } catch (error) {
        res.status(500).json({ message: "There was a problem creating user" })
        // console.log(error);
    };
};

// Login Admin
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, userType: "admin" }, process.env.JWT_KEY, {
      expiresIn: '5d',
    });

    res.json({ token, admin });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong, please try again' });
    // console.log(error);
  }
};

// Get all user in the databse
const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from both collections
    const publicUsers = await PublicUser.find().select("-password");
    // console.log("Public Users:", publicUsers); // Debug
    const universityUsers = await UniversityUser.find().select("-password");
    // console.log("University Users:", universityUsers); // Debug

    // Combine results
    const allUsers = [...publicUsers, ...universityUsers];
    res.status(200).json({
      message: "All users fetched successfully",
      publicUserCount: publicUsers.length,
      universityUserCount: universityUsers.length,
      totalUserCount: allUsers.length,
      users: allUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Attempt to find the user in both UniversityUser and PublicUser models
    let user = await UniversityUser.findById(id).lean();
    if (!user) {
      user = await PublicUser.findById(id).lean();
    }

    // Handle non-existent user
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params; // User ID
    const { status, startDate, endDate } = req.body; // Subscription details

    // Validate status
    const validStatuses = [true, false]; // Boolean values
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Validate startDate and endDate if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({ message: "Invalid start date" });
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({ message: "Invalid end date" });
    }

    // Ensure startDate is before endDate if both are provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        message: "Start date cannot be after end date",
      });
    }

    // Update the user's subscription status, startDate, and endDate
    const updateFields = {
      "subscription.status": status,
    };
    if (startDate) updateFields["subscription.startDate"] = new Date(startDate);
    if (endDate) updateFields["subscription.endDate"] = new Date(endDate);

    const user =
      (await UniversityUser.findByIdAndUpdate(id, updateFields, { new: true })) ||
      (await PublicUser.findByIdAndUpdate(id, updateFields, { new: true }));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Subscription updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { 
  registerAdmin, 
  loginAdmin, 
  getAllUsers, 
  getUserDetails, 
  updateUserStatus 
};
