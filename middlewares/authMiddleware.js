const jwt = require("jsonwebtoken");
const { UniversityUser, PublicUser } = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract the token
      token = req.headers.authorization.split(" ")[1];

      // Decode the token
      const decoded = jwt.verify(token, process.env.JWT_KEY);

      // Determine user model based on userType
      let user;
      if (decoded.userType === "student" || decoded.userType === "staff") {
        user = await UniversityUser.findById(decoded.id).select("-password");
      } else if (decoded.userType === "public") {
        user = await PublicUser.findById(decoded.id).select("-password");
      } else {
        return res.status(401).json({ message: "Unauthorized: Invalid user type" });
      }

      // Handle non-existent user
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Attach user and userType to the request object
      req.user = user;
      req.userType = decoded.userType;

      next(); // Continue to the next middleware
    } catch (error) {
      console.error("Token verification failed:", error.message);
      res.status(401).json({ message: "Unauthorized: Token verification failed" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized: No token provided" });
  }
};

module.exports = { protect };