import "dotenv/config";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

async function createAdmin() {
  await connectDB();
  
  // Hash the password 'admin123'
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("admin123", salt);

  // Upsert (create if not exists, update if exists) the admin user
  const adminUser = await User.findOneAndUpdate(
    { email: "admin@nyaysahayak.com" },
    { 
      $set: { 
        name: "Nyay Sahayak Admin",
        password: hashedPassword,
        role: "admin",
        preferredLanguage: "en",
        plan: "pro",
        subscriptionStatus: "active"
      } 
    },
    { new: true, upsert: true }
  );
  
  console.log("\n==============================================");
  console.log("✅ Admin User Successfully Created / Updated");
  console.log("Email:    admin@nyaysahayak.com");
  console.log("Password: admin123");
  console.log("Role:     " + adminUser.role.toUpperCase());
  console.log("==============================================\n");
  
  process.exit(0);
}

createAdmin();
