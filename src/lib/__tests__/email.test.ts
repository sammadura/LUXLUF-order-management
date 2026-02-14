import { describe, it, expect } from "vitest";
import {
  buildDesignerEmailHtml,
  buildReceptionistEmailHtml,
} from "@/lib/email";

describe("buildDesignerEmailHtml", () => {
  it("includes order details in HTML", () => {
    const html = buildDesignerEmailHtml({
      customerName: "Mrs. Chen",
      conciergeHotel: "James at The Plaza",
      productDescription: "White peonies",
      quantity: 1,
      deliveryAddress: "The Plaza, Suite 1201",
      deliveryTime: new Date("2026-02-14T14:00:00"),
      specialInstructions: "Anniversary",
    });
    expect(html).toContain("Mrs. Chen");
    expect(html).toContain("White peonies");
    expect(html).toContain("Anniversary");
    expect(html).toContain("James at The Plaza");
  });

  it("handles missing special instructions", () => {
    const html = buildDesignerEmailHtml({
      customerName: "Mr. Park",
      conciergeHotel: "Sofia at The Peninsula",
      productDescription: "Roses",
      quantity: 6,
      deliveryAddress: "The Peninsula",
      deliveryTime: new Date("2026-02-14T17:30:00"),
    });
    expect(html).toContain("Mr. Park");
    expect(html).not.toContain("undefined");
  });
});

describe("buildReceptionistEmailHtml", () => {
  it("includes payment and delivery details", () => {
    const html = buildReceptionistEmailHtml({
      customerName: "Mrs. Chen",
      conciergeHotel: "James at The Plaza",
      productDescription: "White peonies",
      quantity: 1,
      deliveryAddress: "The Plaza, Suite 1201",
      deliveryTime: new Date("2026-02-14T14:00:00"),
      orderAmount: 450,
      announcementText: "LUXLUF ORDER CONFIRMATION...",
    });
    expect(html).toContain("Mrs. Chen");
    expect(html).toContain("450");
    expect(html).toContain("LUXLUF ORDER CONFIRMATION");
  });

  it("handles missing announcement text", () => {
    const html = buildReceptionistEmailHtml({
      customerName: "Mr. Park",
      conciergeHotel: "Sofia",
      productDescription: "Roses",
      quantity: 6,
      deliveryAddress: "The Peninsula",
      deliveryTime: new Date("2026-02-14T17:30:00"),
      orderAmount: 1800,
    });
    expect(html).toContain("Mr. Park");
    expect(html).toContain("1800");
  });
});
