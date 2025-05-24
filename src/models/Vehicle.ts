// src/models/Vehicle.ts
import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IVehicle extends Document {
  make: string;
  vehicleModel: string;
  year: number;
  license: string; // Assuming license plate
  status: "available" | "leased" | "maintenance";
  leasePrice: number;
  imageUrl?: string;
  description?: string;
  features?: string[];
  ownerId: mongoose.Schema.Types.ObjectId;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    make: { type: String, required: true },
    vehicleModel: { type: String, required: true },
    year: { type: Number, required: true },
    license: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["available", "leased", "maintenance"],
      default: "available",
    },
    leasePrice: { type: Number, required: true },
    imageUrl: String,
    description: String,
    features: [String],
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Link to User model
  },
  { timestamps: true }
);

// Ensure the model is registered only once
const VehicleModel = (models.Vehicle as Model<IVehicle>) || mongoose.model<IVehicle>("Vehicle", vehicleSchema);

export default VehicleModel;