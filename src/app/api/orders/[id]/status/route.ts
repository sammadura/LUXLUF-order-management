import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/actions/orders";
import type { OrderStatus } from "@prisma/client";
import type { Role } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status, role, driverName } = body as {
    status: OrderStatus;
    role: Role;
    driverName?: string;
  };

  if (!status || !role) {
    return NextResponse.json(
      { error: "status and role are required" },
      { status: 400 }
    );
  }

  const orderId = parseInt(id);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const result = await updateOrderStatus(orderId, status, role, {
    driverName,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
