import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOrderInput } from "@/lib/actions/orders";
import { sendDesignerNotification } from "@/lib/email";
import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/types";

const VALID_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status: OrderStatus | null =
      statusParam && VALID_STATUSES.includes(statusParam as OrderStatus)
        ? (statusParam as OrderStatus)
        : null;
    const date = searchParams.get("date");

    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ errors: [message] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateOrderInput(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        customerName: body.customerName,
        contactInfo: body.contactInfo,
        conciergeHotel: body.conciergeHotel,
        productDescription: body.productDescription,
        quantity: body.quantity,
        deliveryAddress: body.deliveryAddress,
        deliveryTime: new Date(body.deliveryTime),
        specialInstructions: body.specialInstructions || null,
        orderAmount: body.orderAmount,
        rawNotes: body.rawNotes || null,
        status: "SUBMITTED",
      },
    });

    sendDesignerNotification({
      customerName: order.customerName,
      conciergeHotel: order.conciergeHotel,
      productDescription: order.productDescription,
      quantity: order.quantity,
      deliveryAddress: order.deliveryAddress,
      deliveryTime: order.deliveryTime,
      specialInstructions: order.specialInstructions,
    }).catch(console.error);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { errors: [message] },
      { status: 500 },
    );
  }
}
