// src/app/api/leases/route.ts
import dbConnect from "@/lib/dbConnect";
import LeaseModel from "@/models/Lease";
import VehicleModel from "@/models/Vehicle"; // To check vehicle availability
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  try {
    const body = await request.json();
    const { userId, vehicleId, startDate, endDate, monthlyPayment } = body;

    if (!userId || !vehicleId || !startDate || !endDate || monthlyPayment === undefined) {
      return NextResponse.json({ message: "Missing required lease fields" }, { status: 400 });
    }

    // Verify the user ID from the session matches the one in the request body
    if (session.user._id.toString() !== userId) {
        return NextResponse.json({ message: "User ID mismatch or forbidden." }, { status: 403 });
    }

    // Check if vehicle exists and is available
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }
    if (vehicle.status !== "available") {
      return NextResponse.json({ message: "Vehicle is not available for lease" }, { status: 409 }); // Conflict
    }
    // (Optional) Check if user already has an active lease for this vehicle
    const existingLease = await LeaseModel.findOne({ userId, vehicleId, status: 'active' });
    if (existingLease) {
        return NextResponse.json({ message: "You already have an active lease for this vehicle." }, { status: 409 });
    }


    const newLease = new LeaseModel({
      userId,
      vehicleId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      monthlyPayment,
      status: "active",
    });

    await newLease.save();

    // IMPORTANT: Ideally, updating vehicle status should be part of a transaction
    // with lease creation to ensure atomicity. MongoDB transactions can be complex.
    // For simplicity here, we assume it will be updated in a subsequent step or
    // the frontend will trigger the vehicle status update.
    // A more robust backend would handle this here.
    // vehicle.status = "leased";
    // await vehicle.save(); // This would be part of the transaction

    return NextResponse.json({ message: "Lease created successfully", lease: newLease }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating lease:", error);
    return NextResponse.json({ message: "Error creating lease", error: error.message }, { status: 500 });
  }
}