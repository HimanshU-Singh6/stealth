import dbConnect from "@/lib/dbConnect";
import LeaseModel from "@/models/Lease";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  try {
    const userId = session.user._id;
    // Find leases for the user and populate vehicle details
    const leases = await LeaseModel.find({ userId: userId })
      .populate({
        path: 'vehicleId',
        model: 'Vehicle', // Explicitly provide model name if not automatically inferred
        select: 'make vehicleModel year imageUrl leasePrice status license' // Select fields you want from Vehicle
      })
      .sort({ startDate: -1 }); // Sort by most recent start date

    return NextResponse.json(leases, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user's leases:", error);
    return NextResponse.json({ message: "Error fetching your leases", error: error.message }, { status: 500 });
  }
}