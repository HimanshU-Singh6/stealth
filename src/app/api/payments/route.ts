// src/app/api/payments/route.ts
import dbConnect from "@/lib/dbConnect";
import PaymentModel from "@/models/Payment";
import LeaseModel from "@/models/Lease"; // To verify lease
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
    const { leaseId, amount, paymentMethod, transactionId } = body;

    if (!leaseId || amount === undefined || !paymentMethod) {
      return NextResponse.json({ message: "Missing required payment fields" }, { status: 400 });
    }

    // Verify lease exists and belongs to the user (or handle admin payments differently)
    const lease = await LeaseModel.findById(leaseId);
    if (!lease) {
      return NextResponse.json({ message: "Lease not found" }, { status: 404 });
    }
    if (lease.userId.toString() !== session.user._id.toString()) {
         return NextResponse.json({ message: "This lease does not belong to the authenticated user." }, { status: 403 });
    }

    const newPayment = new PaymentModel({
      leaseId,
      userId: session.user._id, // User making the payment
      amount,
      paymentMethod,
      transactionId: transactionId || `SIM_${Date.now()}`, // Generate a sim ID if not provided
      status: "succeeded", // For simulation
      paymentDate: new Date(),
    });

    await newPayment.save();

    return NextResponse.json({ message: "Payment recorded successfully", payment: newPayment }, { status: 201 });
  } catch (error: any) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ message: "Error recording payment", error: error.message }, { status: 500 });
  }
}