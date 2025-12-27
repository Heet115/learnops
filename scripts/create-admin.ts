// Run with: npx tsx scripts/create-admin.ts
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://learnops:learnops123@cluster0.4e3llrf.mongodb.net";

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "hod", "professor", "student"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const User = mongoose.model("User", UserSchema);

async function createAdmin() {
  await mongoose.connect(MONGODB_URI);

  // Replace with your Clerk user ID from dashboard
  const admin = await User.create({
    clerkId: "user_37MwEWAkQebqvkh8Q5gzMBFd8gY", // Get this from Clerk Dashboard after creating user
    email: "hpviradiya05@gmail.com",
    firstName: "Heet",
    lastName: "Viradiya",
    role: "admin",
    isActive: true,
  });

  console.log("Admin created:", admin);
  await mongoose.disconnect();
}

createAdmin().catch(console.error);
