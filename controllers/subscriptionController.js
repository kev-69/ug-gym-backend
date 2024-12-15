const { UniversityUser, PublicUser } = require("../models/User");

// Utility function to get the appropriate user model
const getUserModel = (userType) => {
  if (userType === "student" || userType === "staff") return UniversityUser;
  if (userType === "public") return PublicUser;
  throw new Error("Invalid user type");
};

// Add a pending subscription
const addPendingSubscription = async (req, res) => {
  try {
    const { userId, userType, package: pkg, price } = req.body;

    const UserModel = getUserModel(userType);

    const startDate = new Date();
    const endDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        "subscription.package": pkg,
        "subscription.price": price,
        // "subscription.startDate": startDate,
        // "subscription.endDate": endDate,
        "subscription.status": false,
        "pendingAt": new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Pending subscription added successfully",
      subscription: user.subscription,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add subscription",
      error: error.message,
    });
  }
};


// Activate subscription after payment confirmation
const activateSubscription = async (req, res) => {
  try {
    const { userId, userType } = req.body;

    const UserModel = getUserModel(userType);

    // Find the user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if there's a valid pending subscription
    const { status, endDate } = user.subscription || {};
    if (status === undefined || status === true) {
      return res
        .status(400)
        .json({ message: "No pending subscription found" });
    }

    if (new Date() > new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "Pending subscription has expired" });
    }

    // Activate the subscription
    user.subscription.status = true;
    user.subscription.startDate = new Date();
    user.subscription.endDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ); // Example: 1 month duration

    await user.save();

    res.status(200).json({
      message: "Subscription activated successfully",
      subscription: user.subscription,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to activate subscription", error: error.message });
  }
};

// View subscription details
const getSubscriptionDetails = async (req, res) => {
  try {
    const { userId, userType } = req.query;

    const UserModel = getUserModel(userType);

    // Find the user
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      subscription: user.subscription,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve subscription details", error: error.message });
  }
};

module.exports = {
  addPendingSubscription,
  activateSubscription,
  getSubscriptionDetails,
};
