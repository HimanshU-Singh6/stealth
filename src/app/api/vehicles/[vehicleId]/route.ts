import dbConnect from "@/lib/dbConnect";
import VehicleModel from "@/models/Vehicle";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

interface Params {
  vehicleId: string;
}

// GET a single vehicle by ID (Optional, if you need a dedicated endpoint for it)
export async function GET(request: Request, { params }: { params: Params }) {
  await dbConnect();
  try {
    const { vehicleId } = params;
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return NextResponse.json({ message: "Invalid vehicle ID format" }, { status: 400 });
    }

    const vehicle = await VehicleModel.findById(vehicleId).populate('ownerId', 'name email');
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }
    return NextResponse.json(vehicle, { status: 200 });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json({ message: "Error fetching vehicle", error: (error as Error).message }, { status: 500 });
  }
}


// PATCH: Update a vehicle listing
export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user._id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  try {
    const { vehicleId } = params;
     if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return NextResponse.json({ message: "Invalid vehicle ID format" }, { status: 400 });
    }
    const body = await request.json();

    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    // Check if the logged-in user is the owner of the vehicle
    if (vehicle.ownerId.toString() !== session.user._id) {
      return NextResponse.json({ message: "Forbidden: You are not the owner of this vehicle" }, { status: 403 });
    }

    // Prevent ownerId from being updated directly via PATCH
    const { ownerId, ...updateData } = body;

    // Check if updating license and if it conflicts with another vehicle
    if (updateData.license && updateData.license !== vehicle.license) {
        const existingVehicleByLicense = await VehicleModel.findOne({ license: updateData.license, _id: { $ne: vehicleId } });
        if (existingVehicleByLicense) {
            return NextResponse.json(
                { message: "Another vehicle with this license plate already exists." },
                { status: 409 }
            );
        }
    }


    const updatedVehicle = await VehicleModel.findByIdAndUpdate(
      vehicleId,
      updateData,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedVehicle) { // Should not happen if findById found it, but good practice
        return NextResponse.json({ message: "Vehicle not found after update attempt" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Vehicle updated successfully", vehicle: updatedVehicle },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating vehicle:", error);
     if (error.name === 'ValidationError') {
        return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
    }
    if (error.code === 11000 && error.keyPattern && error.keyPattern.license) {
        return NextResponse.json({ message: "Another vehicle with this license plate already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating vehicle", error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a vehicle listing
export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user._id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  try {
    const { vehicleId } = params;
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return NextResponse.json({ message: "Invalid vehicle ID format" }, { status: 400 });
    }

    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    // Check if the logged-in user is the owner
    if (vehicle.ownerId.toString() !== session.user._id) {
      return NextResponse.json({ message: "Forbidden: You are not the owner of this vehicle" }, { status: 403 });
    }

    await VehicleModel.findByIdAndDelete(vehicleId);

    return NextResponse.json(
      { message: "Vehicle deleted successfully" },
      { status: 200 } // Or 204 No Content
    );
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json({ message: "Error deleting vehicle", error: (error as Error).message }, { status: 500 });
  }
}