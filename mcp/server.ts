import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const server = new McpServer({
  name: "luxluf-orders",
  version: "0.1.0",
});

const ORDER_STATUSES = [
  "SUBMITTED",
  "IN_PREPARATION",
  "PAYMENT_RECEIVED",
  "ANNOUNCED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

server.tool(
  "list_orders",
  "List today's orders, optionally filtered by status",
  {
    status: z
      .enum(ORDER_STATUSES)
      .optional()
      .describe("Filter by order status"),
  },
  async ({ status }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        ...(status ? { status: status as OrderStatus } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(orders, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "get_order",
  "Get full details of a specific order by ID",
  {
    id: z.number().describe("The order ID"),
  },
  async ({ id }) => {
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return {
        content: [{ type: "text" as const, text: "Order not found" }],
        isError: true,
      };
    }

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(order, null, 2) },
      ],
    };
  }
);

server.tool(
  "create_order",
  "Create a new order in the system",
  {
    customerName: z.string().describe("Customer name"),
    contactInfo: z.string().describe("Phone or email"),
    conciergeHotel: z.string().describe("Concierge name and hotel"),
    productDescription: z.string().describe("Floral product description"),
    quantity: z.number().default(1).describe("Quantity"),
    deliveryAddress: z.string().describe("Full delivery address"),
    deliveryTime: z.string().describe("ISO 8601 delivery datetime"),
    specialInstructions: z
      .string()
      .optional()
      .describe("Special instructions"),
    orderAmount: z.number().describe("Order amount in USD"),
  },
  async (input) => {
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
        status: "SUBMITTED",
      },
    });

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(order, null, 2) },
      ],
    };
  }
);

server.tool(
  "update_order_status",
  "Update the status of an order",
  {
    id: z.number().describe("The order ID"),
    status: z.enum(ORDER_STATUSES).describe("New status"),
    driverName: z
      .string()
      .optional()
      .describe("Driver name (for OUT_FOR_DELIVERY)"),
  },
  async ({ id, status, driverName }) => {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        ...(driverName ? { driverName } : {}),
      },
    });

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(order, null, 2) },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
