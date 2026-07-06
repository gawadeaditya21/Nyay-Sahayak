import "dotenv/config";
import connectDB from "../config/db.js";
import User from "../models/User.js";

async function listUsers() {
  await connectDB();
  const users = await User.find({});
  console.log("Users in DB:", users.map(u => ({ id: u._id, email: u.email, name: u.name })));
  process.exit(0);
}

listUsers();
