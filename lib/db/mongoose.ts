import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Optionally, specify the database name if it's not in the MONGODB_URI
      // dbName: process.env.MONGODB_DB
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log("Mongoose connection established.");
        return mongoose;
      })
      .catch((err) => {
        console.error("Mongoose connection error:", err);
        // Clear the promise cache on error so subsequent calls can retry
        cached.promise = null;
        throw err; // Rethrow the error to be handled by the caller
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection promise rejects, nullify the promise
    // so that the next attempt can retry.
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
