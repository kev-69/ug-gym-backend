const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin")
const { UniversityUser, PublicUser } = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract the token
      token = req.headers.authorization.split(" ")[1];

      // Decode the token
      const decoded = jwt.verify(token, process.env.JWT_KEY);

      // Determine the user model based on the userType
      let user;
      switch (decoded.userType) {
        case "admin":
          user = await Admin.findById(decoded.id).select("-password");
          break;
        case "student":
        case "staff":
          user = await UniversityUser.findById(decoded.id).select("-password");
          break;
        case "public":
          user = await PublicUser.findById(decoded.id).select("-password");
          break;
        default:
          return res.status(401).json({ message: "Unauthorized: Invalid user type" });
      }

      // Handle non-existent user
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Attach user and userType to the request object
      req.user = user;
      req.userType = decoded.userType;

      next(); // Proceed to the next middleware
    } catch (error) {
      console.error("Token verification failed:", error.message); // Debugging log
      return res.status(401).json({ message: "Unauthorized: Token verification failed" });
    }
  } else {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
};


// Verify admin access middleware
const verifyAdmin = async (req, res, next) => {
  try {
    // console.log("User Type:", req.userType); // Debug
    // console.log("User Info:", req.user);
    // Check if the user is logged in
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user information found" });
    }

    // Check if the user is an admin
    if (req.user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied: Only admins are allowed" });
    }

    next(); // Continue to the next middleware
  } catch (error) {
    console.error("Admin verification failed:", error.message);
    res.status(500).json({ message: "Server error: Unable to verify admin" });
  }
};

module.exports = { protect, verifyAdmin };
