import mongoose, { Schema, Document, models, Model } from "mongoose";

export interface IPayment extends Document {
  leaseId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId; // User who made the payment
  amount: number;
  paymentDate: Date;
  paymentMethod: string; // e.g., "Simulated Card", "Stripe", "PayPal"
  transactionId?: string; // From payment gateway
  status: "succeeded" | "pending" | "failed";
  // Add other fields like invoice_id, receipt_url, etc.
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    leaseId: { type: Schema.Types.ObjectId, ref: "Lease", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now, required: true },
    paymentMethod: { type: String, required: true },
    transactionId: String,
    status: {
      type: String,
      enum: ["succeeded", "pending", "failed"],
      default: "succeeded", // For simulation
    },
  },
  { timestamps: true }
);

const PaymentModel = (models.Payment as Model<IPayment>) || mongoose.model<IPayment>("Payment", paymentSchema);
export default PaymentModel;