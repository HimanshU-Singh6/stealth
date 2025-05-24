import dbConnect from "@/lib/dbConnect";
import VehicleModel from "@/models/Vehicle"; // Your Vehicle model
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options"; // Your NextAuth options

// GET: Fetch all vehicles
export async function GET(request: Request) {
  await dbConnect();
  try {
    // You might want to add pagination, filtering, sorting parameters from the request URL here
    // For now, fetching all
    const vehicles = await VehicleModel.find({}).populate('ownerId', 'name email'); // Optionally populate owner details

    return NextResponse.json(vehicles, { status: 200 });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { message: "Error fetching vehicles", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST: Create a new vehicle listing
export async function POST(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user._id) {
    return NextResponse.json({ message: "Unauthorized. Please log in to list a vehicle." }, { status: 401 });
  }

  await dbConnect();
  try {
    const body = await request.json();

    // Basic validation (use Zod for robust validation on the server too if desired)
    const { make, vehicleModel, year, license, leasePrice, imageUrl, description, features } = body;
    if (!make || !vehicleModel || !year || !license || !leasePrice) {
      return NextResponse.json(
        { message: "Missing required fields: make, model, year, license, leasePrice" },
        { status: 400 }
      );
    }

    // Check if a vehicle with the same license plate already exists
    const existingVehicleByLicense = await VehicleModel.findOne({ license });
    if (existingVehicleByLicense) {
        return NextResponse.json(
            { message: "A vehicle with this license plate already exists." },
            { status: 409 } // Conflict
        );
    }


    const newVehicle = new VehicleModel({
      ...body, // Spread all provided fields
      ownerId: session.user._id, // Assign the logged-in user as the owner
      status: "available", // Default status for new listings
    });

    await newVehicle.save();

    return NextResponse.json(
      { message: "Vehicle listed successfully", vehicle: newVehicle },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating vehicle:", error);
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
    }
    // Handle duplicate key error for license plate if not caught above
    if (error.code === 11000 && error.keyPattern && error.keyPattern.license) {
        return NextResponse.json({ message: "A vehicle with this license plate already exists." }, { status: 409 });
    }
    return NextResponse.json(
      { message: "Error listing vehicle", error: error.message },
      { status: 500 }
    );
  }
}