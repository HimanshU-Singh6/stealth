import dbConnect from "@/lib/dbConnect";
import VehicleModel from "@/models/Vehicle"; // Your Vehicle model
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options"; // Your NextAuth options

export async function GET(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user._id) {
    return NextResponse.json({ message: "Unauthorized. Please log in." }, { status: 401 });
  }

  await dbConnect();
  try {
    const userId = session.user._id;
    const userVehicles = await VehicleModel.find({ ownerId: userId });

    return NextResponse.json(userVehicles, { status: 200 });
  } catch (error) {
    console.error("Error fetching user's vehicles:", error);
    return NextResponse.json(
      { message: "Error fetching your vehicles", error: (error as Error).message },
      { status: 500 }
    );
  }
}