import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface ILease extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  vehicleId: mongoose.Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  monthlyPayment: number;
  status: "active" | "ended" | "cancelled"; // e.g., active, ended, cancelled
  // Add other fields: mileageAtStart, mileageAllowance, earlyTerminationFee, etc.
  createdAt: Date;
  updatedAt: Date;
}

const leaseSchema = new Schema<ILease>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    monthlyPayment: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "ended", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Prevent re-compilation of model if it already exists
const LeaseModel = (models.Lease as Model<ILease>) || mongoose.model<ILease>("Lease", leaseSchema);

export default LeaseModel;