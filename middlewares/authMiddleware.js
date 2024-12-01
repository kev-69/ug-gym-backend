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

      // Check userType from the token
      let user;

      if (decoded.userType === "student" || decoded.userType === "staff") {
        user = await UniversityUser.findById(decoded.id).select("-password");
      } else if (decoded.userType === "public") {
        user = await PublicUser.findById(decoded.id).select("-password");
      } else {
        return res.status(401).json({ message: "Not authorized, invalid user type" });
      }

      // Attach the user to the request object
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      req.user = user;

      next(); // Continue to the next middleware
    } catch (error) {
      console.error("Error verifying token:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };