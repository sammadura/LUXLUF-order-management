import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "LUXLUF Order Management API",
    version: "1.0.0",
    description:
      "REST API for managing same-day floral orders at LUXLUF Event Flowers NYC. AI-enabled with order parsing and announcement generation.",
  },
  servers: [{ url: "/api", description: "Current server" }],
  paths: {
    "/orders": {
      get: {
        summary: "List orders",
        description: "Get today's orders, optionally filtered by status",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "SUBMITTED",
                "IN_PREPARATION",
                "PAYMENT_RECEIVED",
                "ANNOUNCED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
              ],
            },
          },
          {
            name: "date",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Filter by date (default: today)",
          },
        ],
        responses: {
          "200": {
            description: "List of orders",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orders: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Order" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create order",
        description:
          "Create a new order. Triggers email notification to designers.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Order created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    order: { $ref: "#/components/schemas/Order" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation errors" },
        },
      },
    },
    "/orders/{id}": {
      get: {
        summary: "Get order",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": { description: "Order details" },
          "404": { description: "Not found" },
        },
      },
    },
    "/orders/{id}/status": {
      patch: {
        summary: "Update order status",
        description:
          "Transition order status. If transitioning to PAYMENT_RECEIVED, AI generates announcement text and emails receptionist.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status", "role"],
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "SUBMITTED",
                      "IN_PREPARATION",
                      "PAYMENT_RECEIVED",
                      "ANNOUNCED",
                      "OUT_FOR_DELIVERY",
                      "DELIVERED",
                    ],
                  },
                  role: {
                    type: "string",
                    enum: ["hailey", "receptionist", "designer", "driver"],
                  },
                  driverName: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Status updated" },
          "400": { description: "Invalid transition" },
        },
      },
    },
    "/orders/parse": {
      post: {
        summary: "AI parse order notes",
        description:
          "Send raw phone notes and get structured order data back via Claude AI.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["notes"],
                properties: {
                  notes: {
                    type: "string",
                    description: "Raw phone call notes",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Parsed order data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    parsed: { $ref: "#/components/schemas/OrderInput" },
                  },
                },
              },
            },
          },
          "500": { description: "AI parsing failed" },
        },
      },
    },
  },
  components: {
    schemas: {
      OrderInput: {
        type: "object",
        required: [
          "customerName",
          "contactInfo",
          "conciergeHotel",
          "productDescription",
          "quantity",
          "deliveryAddress",
          "deliveryTime",
          "orderAmount",
        ],
        properties: {
          customerName: { type: "string" },
          contactInfo: { type: "string" },
          conciergeHotel: { type: "string" },
          productDescription: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
          deliveryAddress: { type: "string" },
          deliveryTime: { type: "string", format: "date-time" },
          specialInstructions: { type: "string" },
          orderAmount: { type: "number" },
          rawNotes: { type: "string" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "integer" },
          customerName: { type: "string" },
          contactInfo: { type: "string" },
          conciergeHotel: { type: "string" },
          productDescription: { type: "string" },
          quantity: { type: "integer" },
          deliveryAddress: { type: "string" },
          deliveryTime: { type: "string", format: "date-time" },
          specialInstructions: { type: "string", nullable: true },
          orderAmount: { type: "string", description: "Decimal as string" },
          status: {
            type: "string",
            enum: [
              "SUBMITTED",
              "IN_PREPARATION",
              "PAYMENT_RECEIVED",
              "ANNOUNCED",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
            ],
          },
          driverName: { type: "string", nullable: true },
          deliveryPhoto: { type: "string", nullable: true },
          announcementText: { type: "string", nullable: true },
          rawNotes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
