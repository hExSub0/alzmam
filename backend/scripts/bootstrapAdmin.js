require("dotenv").config();
const connectDB = require("../db/connectDB");
const User = require("../models/User");
const mongoose = require("mongoose");

const email = String(process.argv[2] || "").trim().toLowerCase();
const emailPattern = /^\S+@\S+\.\S+$/;

const promoteVerifiedUser = async (targetEmail) => {
  await connectDB();

  const updateResult = await User.updateOne(
    {
      email: targetEmail,
      isEmailVerified: true,
    },
    {
      $set: {
        role: "admin",
        isActive: true,
      },
    },
  );

  if (updateResult.matchedCount === 0) {
    throw new Error("No verified account was found for that email");
  }
};

const run = async () => {
  if (!emailPattern.test(email)) {
    throw new Error("Usage: npm run make-admin -- user@example.com");
  }

  await promoteVerifiedUser(email);
  console.log("Administrator role granted.");
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
