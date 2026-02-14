import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

export interface ParsedOrder {
  customerName: string;
  contactInfo: string;
  conciergeHotel: string;
  productDescription: string;
  quantity: number;
  deliveryAddress: string;
  deliveryTime: string;
  specialInstructions: string;
  orderAmount: number;
}

export function buildOrderParsingPrompt(rawNotes: string): string {
  return `Extract structured order data from these phone notes. Return ONLY valid JSON matching this schema:

{
  "customerName": "string",
  "contactInfo": "string (phone or email, use empty string if not mentioned)",
  "conciergeHotel": "string (concierge name and hotel)",
  "productDescription": "string (detailed floral description)",
  "quantity": number,
  "deliveryAddress": "string (full address)",
  "deliveryTime": "string (ISO 8601 datetime, assume today if no date given)",
  "specialInstructions": "string (any special notes, empty string if none)",
  "orderAmount": number (USD, 0 if not mentioned)
}

Phone notes:
${rawNotes}`;
}

export function buildAnnouncementPrompt(order: {
  customerName: string;
  conciergeHotel: string;
  productDescription: string;
  quantity: number;
  deliveryAddress: string;
  deliveryTime: Date;
  orderAmount: number;
  specialInstructions?: string | null;
}): string {
  return `Generate a professional hard announcement for LUXLUF Event Flowers NYC. This is an internal record used for finance and delivery coordination.

Order details:
- Customer: ${order.customerName}
- Requesting concierge/hotel: ${order.conciergeHotel}
- Product: ${order.productDescription}
- Quantity: ${order.quantity}
- Delivery to: ${order.deliveryAddress}
- Delivery time: ${order.deliveryTime.toLocaleString()}
- Amount: $${order.orderAmount}
${order.specialInstructions ? `- Special instructions: ${order.specialInstructions}` : ""}

Format the announcement with clear sections: ORDER CONFIRMATION, DELIVERY DETAILS, PRODUCT SPECIFICATIONS, and PAYMENT. Keep it concise and professional.`;
}

export async function parseOrderNotes(rawNotes: string): Promise<ParsedOrder> {
  const message = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: buildOrderParsingPrompt(rawNotes),
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");
  return JSON.parse(jsonMatch[0]) as ParsedOrder;
}

export async function generateAnnouncement(order: {
  customerName: string;
  conciergeHotel: string;
  productDescription: string;
  quantity: number;
  deliveryAddress: string;
  deliveryTime: Date;
  orderAmount: number;
  specialInstructions?: string | null;
}): Promise<string> {
  const message = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: buildAnnouncementPrompt(order),
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}
