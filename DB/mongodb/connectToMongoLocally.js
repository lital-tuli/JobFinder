const mongoose = require("mongoose");

const connectToLocalDb = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/JobFinder");
    console.log("Connected to MongoDB locally");
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
  }
};

module.exports = connectToLocalDb;