const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGODB_URL, {  // Corrected to MONGODB_URL
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB connected to ${connect.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
