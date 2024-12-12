const express = require("express");
const router = express.Router();
const {
    addPendingSubscription,
    activateSubscription,
    getSubscriptionDetails,
} = require("../controllers/subscriptionController");

// Add a pending subscription
router.post("/pending", addPendingSubscription);

// Activate a subscription after payment
router.post("/activate", activateSubscription);

// Get subscription details
router.get("/:userId", getSubscriptionDetails);

module.exports = router;