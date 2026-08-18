"use server";

import { connectToDB } from "@/database/mongoose";

export const getAllUsersForNewsEmail = async () => {
  try {
    const mongoose = await connectToDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Mongoose connection is failed");

    const users = await db
      .collection("user")
      .find(
        { email: { $exists: true, $ne: null } },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } },
      )
      .toArray();
    console.log("user length: ", users);
    return users
      .filter((user) => user.email && user.name)
      .map((user) => ({
        id: user.id || user._id.toString() || "",
        email: user.email,
        name: user.name,
      }));
  } catch (error) {
    console.log("Error fetching users for news email:", error);
    throw error;
  }
};
