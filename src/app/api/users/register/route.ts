import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { registerUserSchema } from "@/schemas/userSchema"; // Your Zod schema

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const validation = registerUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input", errors: validation.error.format() }, { status: 400 });
    }

    const { name, email, phone, password } = validation.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 }); // Conflict
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "lessee", // Default role
    });

    // Don't send password back
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    return NextResponse.json({ message: "User created successfully", user: userWithoutPassword }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    // More specific error messages can be useful
    if (error.code === 11000) { // Mongoose duplicate key error
        return NextResponse.json({ message: "Email or phone already in use." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating user", error: error.message }, { status: 500 });
  }
}