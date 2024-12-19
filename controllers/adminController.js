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

module.exports = { registerAdmin, loginAdmin, getAllUsers };
