const mongoose = require("mongoose");

const connectDB = async () => {
  const shouldCreateIndexes = process.env.NODE_ENV !== "production";

  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: shouldCreateIndexes,
  });
};

module.exports = connectDB;
