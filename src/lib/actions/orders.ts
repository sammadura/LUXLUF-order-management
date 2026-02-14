import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { canTransitionStatus } from "@/lib/roles";
import type { Role } from "@/lib/types";
import {
  sendDesignerNotification,
  sendReceptionistNotification,
} from "@/lib/email";
import { generateAnnouncement } from "@/lib/ai";

export interface OrderInput {
  customerName: string;
  contactInfo: string;
  conciergeHotel: string;
  productDescription: string;
  quantity: number;
  deliveryAddress: string;
  deliveryTime: string;
  specialInstructions?: string;
  orderAmount: number;
  rawNotes?: string;
}

interface ValidationResult {
  success: boolean;
  errors: string[];
}

export function validateOrderInput(
  input: Partial<OrderInput>
): ValidationResult {
  const errors: string[] = [];

  if (!input.customerName?.trim()) errors.push("Customer name is required");
  if (!input.contactInfo?.trim()) errors.push("Contact info is required");
  if (!input.conciergeHotel?.trim())
    errors.push("Concierge/hotel is required");
  if (!input.productDescription?.trim())
    errors.push("Product description is required");
  if (!input.deliveryAddress?.trim())
    errors.push("Delivery address is required");
  if (!input.deliveryTime) errors.push("Delivery time is required");
  if (!input.orderAmount || input.orderAmount <= 0)
    errors.push("Order amount must be greater than zero");
  if (!input.quantity || input.quantity < 1)
    errors.push("Quantity must be at least 1");

  return { success: errors.length === 0, errors };
}

export async function createOrder(input: OrderInput) {
  const validation = validateOrderInput(input);
  if (!validation.success) {
    return { success: false as const, errors: validation.errors };
  }

  const order = await prisma.order.create({
    data: {
      customerName: input.customerName,
      contactInfo: input.contactInfo,
      conciergeHotel: input.conciergeHotel,
      productDescription: input.productDescription,
      quantity: input.quantity,
      deliveryAddress: input.deliveryAddress,
      deliveryTime: new Date(input.deliveryTime),
      specialInstructions: input.specialInstructions || null,
      orderAmount: input.orderAmount,
      rawNotes: input.rawNotes || null,
      status: "SUBMITTED",
    },
  });

  // Send email notification to designers (fire-and-forget)
  sendDesignerNotification({
    customerName: order.customerName,
    conciergeHotel: order.conciergeHotel,
    productDescription: order.productDescription,
    quantity: order.quantity,
    deliveryAddress: order.deliveryAddress,
    deliveryTime: order.deliveryTime,
    specialInstructions: order.specialInstructions,
  }).catch(console.error);

  return { success: true as const, orderId: order.id };
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus,
  role: Role,
  extra?: { driverName?: string }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false as const, error: "Order not found" };

  if (!canTransitionStatus(role, order.status, newStatus)) {
    return {
      success: false as const,
      error: "Transition not allowed for your role",
    };
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  // If transitioning to PAYMENT_RECEIVED, generate announcement
  if (newStatus === "PAYMENT_RECEIVED") {
    try {
      const announcement = await generateAnnouncement({
        customerName: order.customerName,
        conciergeHotel: order.conciergeHotel,
        productDescription: order.productDescription,
        quantity: order.quantity,
        deliveryAddress: order.deliveryAddress,
        deliveryTime: order.deliveryTime,
        orderAmount: Number(order.orderAmount),
        specialInstructions: order.specialInstructions,
      });
      updateData.announcementText = announcement;
    } catch (e) {
      console.error("Failed to generate announcement:", e);
    }
  }

  if (extra?.driverName) {
    updateData.driverName = extra.driverName;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });

  // Send receptionist notification when payment received
  if (newStatus === "PAYMENT_RECEIVED") {
    sendReceptionistNotification({
      customerName: updated.customerName,
      conciergeHotel: updated.conciergeHotel,
      productDescription: updated.productDescription,
      quantity: updated.quantity,
      deliveryAddress: updated.deliveryAddress,
      deliveryTime: updated.deliveryTime,
      orderAmount: Number(updated.orderAmount),
      announcementText: updated.announcementText,
    }).catch(console.error);
  }

  return { success: true as const };
}

export async function getOrders(statusFilter?: OrderStatus) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.order.findMany({
    where: {
      createdAt: { gte: today },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrder(id: number) {
  return prisma.order.findUnique({ where: { id } });
}
