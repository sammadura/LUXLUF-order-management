import { describe, it, expect } from "vitest";
import { buildOrderParsingPrompt, buildAnnouncementPrompt } from "@/lib/ai";

describe("buildOrderParsingPrompt", () => {
  it("builds a structured prompt from raw notes", () => {
    const notes =
      "Mrs Chen from the Plaza called, wants white peonies for anniversary, $450, deliver by 2pm to suite 1201";
    const prompt = buildOrderParsingPrompt(notes);
    expect(prompt).toContain(notes);
    expect(prompt).toContain("customerName");
    expect(prompt).toContain("JSON");
  });

  it("includes all expected fields in the prompt", () => {
    const prompt = buildOrderParsingPrompt("test notes");
    expect(prompt).toContain("conciergeHotel");
    expect(prompt).toContain("deliveryAddress");
    expect(prompt).toContain("deliveryTime");
    expect(prompt).toContain("orderAmount");
  });
});

describe("buildAnnouncementPrompt", () => {
  it("builds announcement prompt from order data", () => {
    const order = {
      customerName: "Mrs. Chen",
      conciergeHotel: "James at The Plaza",
      productDescription: "White peonies centerpiece",
      quantity: 1,
      deliveryAddress: "The Plaza Hotel, Suite 1201",
      deliveryTime: new Date("2026-02-14T14:00:00"),
      orderAmount: 450.0,
      specialInstructions: "Anniversary celebration",
    };
    const prompt = buildAnnouncementPrompt(order);
    expect(prompt).toContain("Mrs. Chen");
    expect(prompt).toContain("The Plaza");
    expect(prompt).toContain("450");
    expect(prompt).toContain("Anniversary celebration");
  });

  it("handles missing special instructions", () => {
    const order = {
      customerName: "Mr. Park",
      conciergeHotel: "Sofia at The Peninsula",
      productDescription: "Roses",
      quantity: 6,
      deliveryAddress: "The Peninsula",
      deliveryTime: new Date("2026-02-14T17:30:00"),
      orderAmount: 1800.0,
    };
    const prompt = buildAnnouncementPrompt(order);
    expect(prompt).toContain("Mr. Park");
    expect(prompt).not.toContain("Special instructions");
  });
});
