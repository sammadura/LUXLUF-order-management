import { describe, it, expect } from "vitest";
import {
  canCreateOrder,
  canTransitionStatus,
  getAllowedTransitions,
} from "@/lib/roles";

describe("canCreateOrder", () => {
  it("allows hailey to create orders", () => {
    expect(canCreateOrder("hailey")).toBe(true);
  });

  it("denies other roles from creating orders", () => {
    expect(canCreateOrder("designer")).toBe(false);
    expect(canCreateOrder("receptionist")).toBe(false);
    expect(canCreateOrder("driver")).toBe(false);
  });
});

describe("canTransitionStatus", () => {
  it("allows designer to move SUBMITTED to IN_PREPARATION", () => {
    expect(
      canTransitionStatus("designer", "SUBMITTED", "IN_PREPARATION")
    ).toBe(true);
  });

  it("allows receptionist to move PAYMENT_RECEIVED to ANNOUNCED", () => {
    expect(
      canTransitionStatus("receptionist", "PAYMENT_RECEIVED", "ANNOUNCED")
    ).toBe(true);
  });

  it("allows driver to move ANNOUNCED to OUT_FOR_DELIVERY", () => {
    expect(
      canTransitionStatus("driver", "ANNOUNCED", "OUT_FOR_DELIVERY")
    ).toBe(true);
  });

  it("denies invalid transitions", () => {
    expect(
      canTransitionStatus("designer", "PAYMENT_RECEIVED", "ANNOUNCED")
    ).toBe(false);
  });

  it("allows hailey to do any valid transition", () => {
    expect(
      canTransitionStatus("hailey", "SUBMITTED", "IN_PREPARATION")
    ).toBe(true);
    expect(
      canTransitionStatus("hailey", "PAYMENT_RECEIVED", "ANNOUNCED")
    ).toBe(true);
  });
});

describe("getAllowedTransitions", () => {
  it("returns correct transitions for designer viewing SUBMITTED order", () => {
    expect(getAllowedTransitions("designer", "SUBMITTED")).toEqual([
      "IN_PREPARATION",
    ]);
  });

  it("returns empty array for designer on non-actionable status", () => {
    expect(getAllowedTransitions("designer", "PAYMENT_RECEIVED")).toEqual([]);
  });

  it("returns all transitions for hailey", () => {
    expect(getAllowedTransitions("hailey", "SUBMITTED")).toEqual([
      "IN_PREPARATION",
    ]);
    expect(getAllowedTransitions("hailey", "ANNOUNCED")).toEqual([
      "OUT_FOR_DELIVERY",
    ]);
  });
});
