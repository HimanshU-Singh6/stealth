import dbConnect from "@/lib/dbConnect";
import VehicleModel from "@/models/Vehicle";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

interface Params {
  vehicleId: string;
}

// GET a single vehicle by ID
export async function GET(request: Request, { params }: { params: Params }) {
  await dbConnect();
  try {
    const { vehicleId } = params;
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return NextResponse.json({ message: "Invalid vehicle ID format" }, { status: 400 });
    }

    // Ensure ownerId is populated with _id, name, and email for the details page
    const vehicle = await VehicleModel.findById(vehicleId).populate('ownerId', '_id name email');

    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }
    return NextResponse.json(vehicle, { status: 200 }); // Return the vehicle directly
  } catch (error) {
    console.error("Error fetching vehicle (GET):", error);
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

    const vehicleToUpdate = await VehicleModel.findById(vehicleId).select('+ownerId'); // Select ownerId

    if (!vehicleToUpdate) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    const { ownerId, ...updateData } = body; // Exclude ownerId from direct update via body

    // Conditional ownership check based on what's being updated
    if (Object.keys(updateData).length === 1 && updateData.status === 'leased') {
        // This is the flow from leasing a vehicle.
        // The lease creation itself is authenticated. Assume this status update is a system action.
        console.log(`System/Lease flow updating vehicle ${vehicleId} status to 'leased'.`);
    } else {
        // For any other general edits, enforce that the requester is the owner.
        if (!vehicleToUpdate.ownerId || session.user._id.toString() !== vehicleToUpdate.ownerId.toString()) {
            return NextResponse.json({ message: "Forbidden: You are not authorized to make these changes to the vehicle." }, { status: 403 });
        }
        // Check for license conflict if license is being updated AND is different from current
        if (updateData.license && updateData.license !== vehicleToUpdate.license) {
            const existingVehicleByLicense = await VehicleModel.findOne({ license: updateData.license, _id: { $ne: vehicleId } });
            if (existingVehicleByLicense) {
                return NextResponse.json(
                    { message: "Another vehicle with this license plate already exists." },
                    { status: 409 }
                );
            }
        }
    }

    const updatedVehicle = await VehicleModel.findByIdAndUpdate(
      vehicleId,
      updateData, // Apply the filtered updateData
      { new: true, runValidators: true }
    ).populate('ownerId', '_id name email'); // Re-populate ownerId for the returned object

    if (!updatedVehicle) {
        // This case should be rare if findById found it initially, but good for safety.
        return NextResponse.json({ message: "Vehicle not found after update attempt or update failed" }, { status: 404 });
    }

    // Return the updated vehicle object, nested under 'vehicle' key
    return NextResponse.json(
      { message: "Vehicle updated successfully", vehicle: updatedVehicle },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating vehicle (PATCH):", error);
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

    const vehicle = await VehicleModel.findById(vehicleId).select('+ownerId');
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    if (!vehicle.ownerId || vehicle.ownerId.toString() !== session.user._id.toString()) {
      return NextResponse.json({ message: "Forbidden: You are not the owner of this vehicle" }, { status: 403 });
    }

    await VehicleModel.findByIdAndDelete(vehicleId);

    return NextResponse.json(
      { message: "Vehicle deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting vehicle (DELETE):", error);
    return NextResponse.json({ message: "Error deleting vehicle", error: error.message }, { status: 500 });
  }
}