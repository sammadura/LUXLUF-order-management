import { describe, it, expect } from "vitest";
import { validateOrderInput } from "@/lib/actions/orders";

describe("validateOrderInput", () => {
  const validInput = {
    customerName: "Mrs. Chen",
    contactInfo: "212-555-0101",
    conciergeHotel: "James at The Plaza",
    productDescription: "White peonies",
    quantity: 1,
    deliveryAddress: "The Plaza, Suite 1201",
    deliveryTime: "2026-02-14T14:00:00",
    orderAmount: 450,
  };

  it("accepts valid input", () => {
    const result = validateOrderInput(validInput);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing customer name", () => {
    const result = validateOrderInput({ ...validInput, customerName: "" });
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Customer name is required");
  });

  it("rejects missing contact info", () => {
    const result = validateOrderInput({ ...validInput, contactInfo: "" });
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Contact info is required");
  });

  it("rejects zero or negative amount", () => {
    const result = validateOrderInput({ ...validInput, orderAmount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects missing delivery address", () => {
    const result = validateOrderInput({ ...validInput, deliveryAddress: "" });
    expect(result.success).toBe(false);
  });

  it("rejects quantity less than 1", () => {
    const result = validateOrderInput({ ...validInput, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("collects multiple errors", () => {
    const result = validateOrderInput({
      customerName: "",
      contactInfo: "",
      conciergeHotel: "",
      productDescription: "",
      deliveryAddress: "",
      deliveryTime: "",
      orderAmount: 0,
      quantity: 0,
    });
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3);
  });
});
