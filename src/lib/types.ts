export type { Order, OrderStatus } from "@prisma/client";

export const ROLES = ["hailey", "receptionist", "designer", "driver"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  hailey: "Hailey (Director)",
  receptionist: "Receptionist",
  designer: "Designer",
  driver: "Delivery Driver",
};

export const STATUS_LABELS: Record<
  import("@prisma/client").OrderStatus,
  string
> = {
  SUBMITTED: "Submitted",
  IN_PREPARATION: "In Preparation",
  PAYMENT_RECEIVED: "Payment Received",
  ANNOUNCED: "Announced",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

export const STATUS_FLOW: Record<
  import("@prisma/client").OrderStatus,
  import("@prisma/client").OrderStatus | null
> = {
  SUBMITTED: "IN_PREPARATION",
  IN_PREPARATION: "PAYMENT_RECEIVED",
  PAYMENT_RECEIVED: "ANNOUNCED",
  ANNOUNCED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: null,
};
