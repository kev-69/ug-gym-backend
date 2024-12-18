const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Register Admin
const registerAdmin = async (req, res) => {
    const {
        name,
        email,
        password,
    } = req.body

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await Admin.create({
            name, email, password: hashedPassword
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
    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_KEY, {
      expiresIn: '5d',
    });

    res.json({ token, admin: { id: admin._id, email: admin.email } });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong, please try again' });
    // console.log(error);
  }
};

module.exports = { registerAdmin, loginAdmin };
