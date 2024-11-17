const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// University Schema
const universitySchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    userType: {
        type: String,
        required: true,
    },
    universityId: { // Fixed typo from "unversityId" to "universityId"
        type: Number,
        required: true,
        unique: true,
    },
    hallOrDepartment: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true }); // Moved timestamps to the schema options

// Public Schema
const publicSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    userType: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true }); // Moved timestamps to the schema options

// Password hashing for University schema
universitySchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Password hashing for Public schema
publicSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Create models
const UniversityUser = mongoose.model("UniversityUser", universitySchema);
const PublicUser = mongoose.model("PublicUser", publicSchema);

// Export models
module.exports = { UniversityUser, PublicUser };
