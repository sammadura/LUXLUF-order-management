import type { Role } from "./types";
import type { OrderStatus } from "@prisma/client";

const ROLE_TRANSITIONS: Record<Role, [OrderStatus, OrderStatus][]> = {
  hailey: [
    ["SUBMITTED", "IN_PREPARATION"],
    ["IN_PREPARATION", "PAYMENT_RECEIVED"],
    ["PAYMENT_RECEIVED", "ANNOUNCED"],
    ["ANNOUNCED", "OUT_FOR_DELIVERY"],
    ["OUT_FOR_DELIVERY", "DELIVERED"],
  ],
  receptionist: [["PAYMENT_RECEIVED", "ANNOUNCED"]],
  designer: [["SUBMITTED", "IN_PREPARATION"]],
  driver: [
    ["ANNOUNCED", "OUT_FOR_DELIVERY"],
    ["OUT_FOR_DELIVERY", "DELIVERED"],
  ],
};

export function canCreateOrder(role: Role): boolean {
  return role === "hailey";
}

export function canTransitionStatus(
  role: Role,
  from: OrderStatus,
  to: OrderStatus
): boolean {
  return ROLE_TRANSITIONS[role].some(([f, t]) => f === from && t === to);
}

export function getAllowedTransitions(
  role: Role,
  currentStatus: OrderStatus
): OrderStatus[] {
  return ROLE_TRANSITIONS[role]
    .filter(([from]) => from === currentStatus)
    .map(([, to]) => to);
}
