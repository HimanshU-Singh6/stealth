import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await dbConnect();

    const newUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      password: "securepassword", // normally hashed
      role: "lessee",
    });

    return NextResponse.json({ message: "User created", user: newUser });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}