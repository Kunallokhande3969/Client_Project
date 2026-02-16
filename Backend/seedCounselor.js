const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const Counselor = require("./src/models/Counselor");

dotenv.config();

async function seedCounselor() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await Counselor.findOne({
      email: "counselor@company.com",
    });

    if (existing) {
      console.log("Counselor already exists. Deleting...");
      await Counselor.deleteOne({ email: "counselor@company.com" });
    }

    const hashedPassword = await bcrypt.hash("Counselor@123#Secure", 10);

    await Counselor.create({
      email: "counselor@company.com",
      password: hashedPassword,
    });

    console.log("Seed completed!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

seedCounselor();
