import mongoose from "mongoose";

type ConnectionObject = {
  isConnected?: number;
};

// Prevent multiple connections in dev
const connection: ConnectionObject = (global as any).mongooseConn || {};

async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    console.log("✅ MongoDB already connected.");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || "", {
      dbName: "stealth", // optional: change as needed
    });

    connection.isConnected = db.connections[0].readyState;
    (global as any).mongooseConn = connection;

    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

export default dbConnect;