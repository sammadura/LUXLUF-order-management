# Phase 1 MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI-enabled order management system for LUXLUF Event Flowers NYC with order entry, dashboard, email notifications, AI parsing, AI announcements, REST API, and MCP server.

**Architecture:** Next.js 14 App Router with Server Actions for UI mutations and REST API routes for AI agent access. Prisma ORM with Vercel Postgres. Anthropic SDK for AI features (order parsing, announcement generation). MCP server for Claude Code integration.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, Vercel Postgres, Anthropic SDK, Resend, Vercel Blob, MCP SDK, Vitest

---

## Task 1: Project Foundation — Testing & Utilities

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/utils.ts`
- Create: `src/lib/__tests__/utils.test.ts`
- Modify: `package.json` (add test deps + scripts)

**Step 1: Install testing dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 3: Add test script to package.json**

Add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Write failing test for cn utility**

Create `src/lib/__tests__/utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
});
```

**Step 5: Run test to verify it fails**

```bash
npm test
```
Expected: FAIL — `cn` not found

**Step 6: Implement cn utility**

Create `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 7: Run test to verify it passes**

```bash
npm test
```
Expected: PASS — all 3 tests green

**Step 8: Commit**

```bash
git add vitest.config.ts src/lib/ package.json package-lock.json
git commit -m "feat: add testing setup and cn utility"
```

---

## Task 2: Prisma Schema & Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/prisma.ts`
- Create: `.env.example`

**Step 1: Install additional dependencies**

```bash
npm install @anthropic-ai/sdk resend
```

**Step 2: Create Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderStatus {
  SUBMITTED
  IN_PREPARATION
  PAYMENT_RECEIVED
  ANNOUNCED
  OUT_FOR_DELIVERY
  DELIVERED
}

model Order {
  id                  Int         @id @default(autoincrement())
  customerName        String
  contactInfo         String
  conciergeHotel      String
  productDescription  String
  quantity            Int         @default(1)
  deliveryAddress     String
  deliveryTime        DateTime
  specialInstructions String?
  orderAmount         Decimal     @db.Decimal(10, 2)
  status              OrderStatus @default(SUBMITTED)
  driverName          String?
  deliveryPhoto       String?
  announcementText    String?
  rawNotes            String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

**Step 3: Create .env.example**

Create `.env.example`:

```
DATABASE_URL="postgresql://user:password@host:5432/luxluf?sslmode=require"
ANTHROPIC_API_KEY="sk-ant-..."
RESEND_API_KEY="re_..."
DESIGNER_EMAILS="designer1@example.com,designer2@example.com"
RECEPTIONIST_EMAIL="receptionist@example.com"
```

**Step 4: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 5: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.order.deleteMany();

  const now = new Date();
  const today = (hours: number, minutes: number) => {
    const d = new Date(now);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  await prisma.order.createMany({
    data: [
      {
        customerName: "Mrs. Chen",
        contactInfo: "212-555-0101",
        conciergeHotel: "James at The Plaza",
        productDescription: "Grand centerpiece arrangement - white peonies, garden roses, eucalyptus",
        quantity: 1,
        deliveryAddress: "The Plaza Hotel, 768 5th Ave, Suite 1201",
        deliveryTime: today(14, 0),
        specialInstructions: "Guest is celebrating anniversary. Include handwritten card.",
        orderAmount: 450.0,
        status: OrderStatus.SUBMITTED,
      },
      {
        customerName: "Mr. & Mrs. Park",
        contactInfo: "646-555-0202",
        conciergeHotel: "Sofia at The Peninsula",
        productDescription: "6 low arrangements for dinner table - blush pink roses, ranunculus",
        quantity: 6,
        deliveryAddress: "The Peninsula, 700 5th Ave, Rooftop Dining",
        deliveryTime: today(17, 30),
        orderAmount: 1800.0,
        status: OrderStatus.IN_PREPARATION,
      },
      {
        customerName: "Thompson Wedding Party",
        contactInfo: "wedding@thompson.com",
        conciergeHotel: "Marcus at The St. Regis",
        productDescription: "Bridal suite arrangement - cascading orchids, white lilies, trailing ivy",
        quantity: 1,
        deliveryAddress: "The St. Regis, 2 E 55th St, Bridal Suite 4200",
        deliveryTime: today(11, 0),
        specialInstructions: "FRAGILE - no strong scents, bride has allergies. Coordinate with wedding planner Sarah at 917-555-0303.",
        orderAmount: 675.0,
        status: OrderStatus.PAYMENT_RECEIVED,
      },
    ],
  });

  console.log("Seeded 3 sample orders");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

**Step 6: Generate Prisma client and push schema**

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

Note: Requires `DATABASE_URL` in `.env`. If using Neon, create a free project at neon.tech first.

**Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts .env.example
git commit -m "feat: add Prisma schema with Order model and seed data"
```

---

## Task 3: Shared Types & Role Management

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/roles.ts`
- Create: `src/lib/__tests__/roles.test.ts`

**Step 1: Create shared types**

Create `src/lib/types.ts`:

```typescript
import type { Order, OrderStatus } from "@prisma/client";

export type { Order, OrderStatus };

export const ROLES = ["hailey", "receptionist", "designer", "driver"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  hailey: "Hailey (Director)",
  receptionist: "Receptionist",
  designer: "Designer",
  driver: "Delivery Driver",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  SUBMITTED: "Submitted",
  IN_PREPARATION: "In Preparation",
  PAYMENT_RECEIVED: "Payment Received",
  ANNOUNCED: "Announced",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

export const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  SUBMITTED: "IN_PREPARATION",
  IN_PREPARATION: "PAYMENT_RECEIVED",
  PAYMENT_RECEIVED: "ANNOUNCED",
  ANNOUNCED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: null,
};
```

**Step 2: Write failing test for role helpers**

Create `src/lib/__tests__/roles.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  canCreateOrder,
  canTransitionStatus,
  getAllowedTransitions,
} from "@/lib/roles";
import type { OrderStatus } from "@prisma/client";

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
});
```

**Step 3: Run test to verify it fails**

```bash
npm test src/lib/__tests__/roles.test.ts
```
Expected: FAIL — module not found

**Step 4: Implement role helpers**

Create `src/lib/roles.ts`:

```typescript
import type { Role } from "./types";
import type { OrderStatus } from "@prisma/client";
import { STATUS_FLOW } from "./types";

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
  return ROLE_TRANSITIONS[role].some(
    ([f, t]) => f === from && t === to
  );
}

export function getAllowedTransitions(
  role: Role,
  currentStatus: OrderStatus
): OrderStatus[] {
  return ROLE_TRANSITIONS[role]
    .filter(([from]) => from === currentStatus)
    .map(([, to]) => to);
}
```

**Step 5: Run test to verify it passes**

```bash
npm test src/lib/__tests__/roles.test.ts
```
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/roles.ts src/lib/__tests__/
git commit -m "feat: add shared types and role-based permission helpers"
```

---

## Task 4: AI Services — Order Parsing & Announcement Generation

**Files:**
- Create: `src/lib/ai.ts`
- Create: `src/lib/__tests__/ai.test.ts`

**Step 1: Write failing test for AI order parsing**

Create `src/lib/__tests__/ai.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildOrderParsingPrompt, buildAnnouncementPrompt } from "@/lib/ai";

describe("buildOrderParsingPrompt", () => {
  it("builds a structured prompt from raw notes", () => {
    const notes = "Mrs Chen from the Plaza called, wants white peonies for anniversary, $450, deliver by 2pm to suite 1201";
    const prompt = buildOrderParsingPrompt(notes);
    expect(prompt).toContain(notes);
    expect(prompt).toContain("customerName");
    expect(prompt).toContain("JSON");
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
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/__tests__/ai.test.ts
```
Expected: FAIL

**Step 3: Implement AI prompt builders and API wrapper**

Create `src/lib/ai.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

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
  const message = await anthropic.messages.create({
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
  const message = await anthropic.messages.create({
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
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/__tests__/ai.test.ts
```
Expected: PASS (tests only cover prompt builders, not API calls)

**Step 5: Commit**

```bash
git add src/lib/ai.ts src/lib/__tests__/ai.test.ts
git commit -m "feat: add AI services for order parsing and announcement generation"
```

---

## Task 5: Email Service

**Files:**
- Create: `src/lib/email.ts`
- Create: `src/lib/__tests__/email.test.ts`

**Step 1: Write failing test for email builders**

Create `src/lib/__tests__/email.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildDesignerEmailHtml, buildReceptionistEmailHtml } from "@/lib/email";

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
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/__tests__/email.test.ts
```
Expected: FAIL

**Step 3: Implement email service**

Create `src/lib/email.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
  customerName: string;
  conciergeHotel: string;
  productDescription: string;
  quantity: number;
  deliveryAddress: string;
  deliveryTime: Date;
  specialInstructions?: string | null;
}

interface AnnouncementEmailData extends OrderEmailData {
  orderAmount: number;
  announcementText?: string | null;
}

export function buildDesignerEmailHtml(order: OrderEmailData): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #825d4a; border-bottom: 2px solid #e0d5c6; padding-bottom: 12px;">
        New Order — ${order.customerName}
      </h1>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Hotel/Concierge</td><td>${order.conciergeHotel}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Product</td><td>${order.productDescription}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Quantity</td><td>${order.quantity}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Deliver To</td><td>${order.deliveryAddress}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Delivery Time</td><td>${order.deliveryTime.toLocaleString()}</td></tr>
        ${order.specialInstructions ? `<tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Special Instructions</td><td style="color: #9c7258; font-style: italic;">${order.specialInstructions}</td></tr>` : ""}
      </table>
    </div>
  `;
}

export function buildReceptionistEmailHtml(order: AnnouncementEmailData): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #825d4a; border-bottom: 2px solid #e0d5c6; padding-bottom: 12px;">
        Payment Received — Ready for Announcement
      </h1>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Customer</td><td>${order.customerName}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Hotel/Concierge</td><td>${order.conciergeHotel}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Amount</td><td>$${order.orderAmount}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Delivery</td><td>${order.deliveryAddress} by ${order.deliveryTime.toLocaleString()}</td></tr>
      </table>
      ${order.announcementText ? `
        <div style="margin-top: 24px; padding: 16px; background: #faf8f5; border-left: 4px solid #a98464;">
          <h3 style="color: #574136; margin-top: 0;">AI-Generated Announcement (review before sending)</h3>
          <pre style="white-space: pre-wrap; font-family: Georgia, serif; color: #6a4d40;">${order.announcementText}</pre>
        </div>
      ` : ""}
    </div>
  `;
}

export async function sendDesignerNotification(order: OrderEmailData) {
  const emails = (process.env.DESIGNER_EMAILS ?? "").split(",").filter(Boolean);
  if (emails.length === 0) return;

  await resend.emails.send({
    from: "LUXLUF Orders <orders@luxluf.com>",
    to: emails,
    subject: `New Order: ${order.customerName} — ${order.productDescription.slice(0, 50)}`,
    html: buildDesignerEmailHtml(order),
  });
}

export async function sendReceptionistNotification(order: AnnouncementEmailData) {
  const email = process.env.RECEPTIONIST_EMAIL;
  if (!email) return;

  await resend.emails.send({
    from: "LUXLUF Orders <orders@luxluf.com>",
    to: [email],
    subject: `Payment Received — ${order.customerName} — Ready for Announcement`,
    html: buildReceptionistEmailHtml(order),
  });
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/__tests__/email.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/email.ts src/lib/__tests__/email.test.ts
git commit -m "feat: add email service with designer and receptionist notifications"
```

---

## Task 6: Server Actions — Order CRUD

**Files:**
- Create: `src/lib/actions/orders.ts`
- Create: `src/lib/actions/__tests__/orders.test.ts`

**Step 1: Write failing test for order validation**

Create `src/lib/actions/__tests__/orders.test.ts`:

```typescript
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
  });

  it("rejects missing customer name", () => {
    const result = validateOrderInput({ ...validInput, customerName: "" });
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Customer name is required");
  });

  it("rejects zero or negative amount", () => {
    const result = validateOrderInput({ ...validInput, orderAmount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects missing delivery address", () => {
    const result = validateOrderInput({ ...validInput, deliveryAddress: "" });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/actions/__tests__/orders.test.ts
```
Expected: FAIL

**Step 3: Implement Server Actions**

Create `src/lib/actions/orders.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { canTransitionStatus } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { STATUS_FLOW } from "@/lib/types";
import { sendDesignerNotification, sendReceptionistNotification } from "@/lib/email";
import { generateAnnouncement } from "@/lib/ai";

interface OrderInput {
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

export function validateOrderInput(input: Partial<OrderInput>): ValidationResult {
  const errors: string[] = [];

  if (!input.customerName?.trim()) errors.push("Customer name is required");
  if (!input.contactInfo?.trim()) errors.push("Contact info is required");
  if (!input.conciergeHotel?.trim()) errors.push("Concierge/hotel is required");
  if (!input.productDescription?.trim()) errors.push("Product description is required");
  if (!input.deliveryAddress?.trim()) errors.push("Delivery address is required");
  if (!input.deliveryTime) errors.push("Delivery time is required");
  if (!input.orderAmount || input.orderAmount <= 0) errors.push("Order amount must be greater than zero");
  if (!input.quantity || input.quantity < 1) errors.push("Quantity must be at least 1");

  return { success: errors.length === 0, errors };
}

export async function createOrder(input: OrderInput) {
  const validation = validateOrderInput(input);
  if (!validation.success) {
    return { success: false, errors: validation.errors };
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

  revalidatePath("/dashboard");
  return { success: true, orderId: order.id };
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus,
  role: Role,
  extra?: { driverName?: string }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, error: "Order not found" };

  if (!canTransitionStatus(role, order.status, newStatus)) {
    return { success: false, error: "Transition not allowed for your role" };
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  // If transitioning to PAYMENT_RECEIVED, generate announcement
  if (newStatus === "PAYMENT_RECEIVED") {
    try {
      const announcement = await generateAnnouncement(order);
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

  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);
  return { success: true };
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
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/actions/__tests__/orders.test.ts
```
Expected: PASS (validation tests pass; Server Actions tested via integration)

**Step 5: Commit**

```bash
git add src/lib/actions/
git commit -m "feat: add Server Actions for order CRUD with validation"
```

---

## Task 7: REST API Routes

**Files:**
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/orders/[id]/route.ts`
- Create: `src/app/api/orders/[id]/status/route.ts`
- Create: `src/app/api/orders/parse/route.ts`

**Step 1: Create GET/POST orders endpoint**

Create `src/app/api/orders/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOrderInput } from "@/lib/actions/orders";
import { sendDesignerNotification } from "@/lib/email";
import type { OrderStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as OrderStatus | null;
  const date = searchParams.get("date");

  const today = date ? new Date(date) : new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow },
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = validateOrderInput(body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      customerName: body.customerName,
      contactInfo: body.contactInfo,
      conciergeHotel: body.conciergeHotel,
      productDescription: body.productDescription,
      quantity: body.quantity,
      deliveryAddress: body.deliveryAddress,
      deliveryTime: new Date(body.deliveryTime),
      specialInstructions: body.specialInstructions || null,
      orderAmount: body.orderAmount,
      rawNotes: body.rawNotes || null,
      status: "SUBMITTED",
    },
  });

  sendDesignerNotification({
    customerName: order.customerName,
    conciergeHotel: order.conciergeHotel,
    productDescription: order.productDescription,
    quantity: order.quantity,
    deliveryAddress: order.deliveryAddress,
    deliveryTime: order.deliveryTime,
    specialInstructions: order.specialInstructions,
  }).catch(console.error);

  return NextResponse.json({ order }, { status: 201 });
}
```

**Step 2: Create GET single order endpoint**

Create `src/app/api/orders/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
```

**Step 3: Create status update endpoint**

Create `src/app/api/orders/[id]/status/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/actions/orders";
import type { OrderStatus } from "@prisma/client";
import type { Role } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { status, role, driverName } = body as {
    status: OrderStatus;
    role: Role;
    driverName?: string;
  };

  if (!status || !role) {
    return NextResponse.json(
      { error: "status and role are required" },
      { status: 400 }
    );
  }

  const result = await updateOrderStatus(
    parseInt(params.id),
    status,
    role,
    { driverName }
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 4: Create AI order parsing endpoint**

Create `src/app/api/orders/parse/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { parseOrderNotes } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const { notes } = await request.json();

  if (!notes?.trim()) {
    return NextResponse.json(
      { error: "notes field is required" },
      { status: 400 }
    );
  }

  try {
    const parsed = await parseOrderNotes(notes);
    return NextResponse.json({ parsed });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to parse order notes" },
      { status: 500 }
    );
  }
}
```

**Step 5: Commit**

```bash
git add src/app/api/
git commit -m "feat: add REST API routes for orders, status updates, and AI parsing"
```

---

## Task 8: App Layout & Global Styles

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

**Step 1: Create global styles**

Create `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-luxluf-50 text-luxluf-900 antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-luxluf-700 text-luxluf-50 px-6 py-3 font-serif text-sm tracking-wide
           hover:bg-luxluf-800 transition-colors duration-200;
  }

  .btn-secondary {
    @apply border border-luxluf-300 text-luxluf-700 px-6 py-3 font-serif text-sm tracking-wide
           hover:bg-luxluf-100 transition-colors duration-200;
  }

  .card {
    @apply bg-white border border-luxluf-200 p-6 shadow-sm;
  }

  .input {
    @apply w-full border border-luxluf-300 bg-white px-4 py-3 text-luxluf-900
           placeholder:text-luxluf-400 focus:border-luxluf-500 focus:outline-none
           focus:ring-1 focus:ring-luxluf-500 transition-colors;
  }

  .label {
    @apply block text-sm font-serif text-luxluf-700 mb-1.5 tracking-wide;
  }
}
```

**Step 2: Create root layout**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUXLUF Order Management",
  description: "Same-day floral order management for LUXLUF Event Flowers NYC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-luxluf-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <a href="/" className="font-serif text-2xl text-luxluf-800 tracking-widest">
              LUXLUF
            </a>
            <nav className="flex gap-6 text-sm text-luxluf-600">
              <a href="/dashboard" className="hover:text-luxluf-800 transition-colors">
                Dashboard
              </a>
              <a href="/orders/new" className="hover:text-luxluf-800 transition-colors">
                New Order
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add root layout and global styles with luxluf branding"
```

---

## Task 9: Role Selector (Landing Page)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/RoleSelector.tsx`

**Step 1: Create RoleSelector component**

Create `src/components/RoleSelector.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/types";

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  hailey: "Create orders, manage all statuses, oversee operations",
  receptionist: "View orders, send hard announcements",
  designer: "View incoming orders, mark as in preparation",
  driver: "View assigned orders, confirm deliveries with photos",
};

const ROLE_ICONS: Record<Role, string> = {
  hailey: "Crown",
  receptionist: "Bell",
  designer: "Palette",
  driver: "Truck",
};

export default function RoleSelector() {
  const router = useRouter();

  function selectRole(role: Role) {
    document.cookie = `luxluf-role=${role};path=/;max-age=${60 * 60 * 24 * 30}`;
    router.push("/dashboard");
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ROLES.map((role) => (
        <button
          key={role}
          onClick={() => selectRole(role)}
          className="card text-left group hover:border-luxluf-500 hover:shadow-md transition-all duration-200"
        >
          <h3 className="font-serif text-lg text-luxluf-800 group-hover:text-luxluf-600 transition-colors">
            {ROLE_LABELS[role]}
          </h3>
          <p className="mt-2 text-sm text-luxluf-500 leading-relaxed">
            {ROLE_DESCRIPTIONS[role]}
          </p>
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Create landing page**

Create `src/app/page.tsx`:

```tsx
import RoleSelector from "@/components/RoleSelector";

export default function HomePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl text-luxluf-800 tracking-widest mb-2">
          LUXLUF
        </h1>
        <p className="text-luxluf-500 font-serif text-lg mb-12">
          Order Management
        </p>
        <div className="text-left">
          <p className="text-sm text-luxluf-600 mb-4">Select your role to continue:</p>
          <RoleSelector />
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/page.tsx src/components/RoleSelector.tsx
git commit -m "feat: add role selector landing page"
```

---

## Task 10: Order Dashboard

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/OrderCard.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/StatusFilter.tsx`

**Step 1: Create StatusBadge component**

Create `src/components/StatusBadge.tsx`:

```tsx
import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<OrderStatus, string> = {
  SUBMITTED: "bg-amber-100 text-amber-800 border-amber-200",
  IN_PREPARATION: "bg-blue-100 text-blue-800 border-blue-200",
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ANNOUNCED: "bg-purple-100 text-purple-800 border-purple-200",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800 border-orange-200",
  DELIVERED: "bg-luxluf-100 text-luxluf-800 border-luxluf-200",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-block border px-3 py-1 text-xs font-medium tracking-wide",
        STATUS_COLORS[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
```

**Step 2: Create OrderCard component**

Create `src/components/OrderCard.tsx`:

```tsx
import type { Order } from "@prisma/client";
import StatusBadge from "./StatusBadge";

export default function OrderCard({ order }: { order: Order }) {
  return (
    <a href={`/orders/${order.id}`} className="card block group hover:border-luxluf-400 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg text-luxluf-800 truncate group-hover:text-luxluf-600 transition-colors">
            {order.customerName}
          </h3>
          <p className="text-sm text-luxluf-500 mt-0.5">{order.conciergeHotel}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-3 text-sm text-luxluf-700 line-clamp-2">
        {order.productDescription}
      </p>
      <div className="mt-4 flex items-center gap-6 text-xs text-luxluf-500">
        <span>Qty: {order.quantity}</span>
        <span>${Number(order.orderAmount).toLocaleString()}</span>
        <span>
          Deliver by{" "}
          {new Date(order.deliveryTime).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </a>
  );
}
```

**Step 3: Create StatusFilter component**

Create `src/components/StatusFilter.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: (OrderStatus | "ALL")[] = [
  "ALL",
  "SUBMITTED",
  "IN_PREPARATION",
  "PAYMENT_RECEIVED",
  "ANNOUNCED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "ALL";

  function setFilter(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status)}
          className={cn(
            "px-4 py-2 text-xs tracking-wide border transition-colors",
            current === status
              ? "bg-luxluf-700 text-luxluf-50 border-luxluf-700"
              : "bg-white text-luxluf-600 border-luxluf-300 hover:border-luxluf-500"
          )}
        >
          {status === "ALL" ? "All Orders" : STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
```

**Step 4: Create dashboard page**

Create `src/app/dashboard/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import OrderCard from "@/components/OrderCard";
import StatusFilter from "@/components/StatusFilter";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statusFilter = searchParams.status as OrderStatus | undefined;

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: today },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-luxluf-800">Today's Orders</h1>
          <p className="text-sm text-luxluf-500 mt-1">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <a href="/orders/new" className="btn-primary">
          New Order
        </a>
      </div>
      <StatusFilter />
      <div className="mt-6 grid gap-4">
        {orders.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-luxluf-400 font-serif">No orders yet today</p>
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/app/dashboard/ src/components/OrderCard.tsx src/components/StatusBadge.tsx src/components/StatusFilter.tsx
git commit -m "feat: add order dashboard with status filtering"
```

---

## Task 11: Order Entry Form with AI Parsing

**Files:**
- Create: `src/app/orders/new/page.tsx`
- Create: `src/components/OrderForm.tsx`
- Create: `src/components/AiNotesParser.tsx`

**Step 1: Create AI notes parser component**

Create `src/components/AiNotesParser.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { ParsedOrder } from "@/lib/ai";

interface Props {
  onParsed: (data: ParsedOrder) => void;
}

export default function AiNotesParser({ onParsed }: Props) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!notes.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error("Failed to parse notes");

      const { parsed } = await res.json();
      onParsed(parsed);
    } catch (e) {
      setError("Could not parse notes. Please fill in the form manually.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-8 border-luxluf-300 bg-luxluf-50">
      <h3 className="font-serif text-lg text-luxluf-800 mb-3">
        AI Order Assistant
      </h3>
      <p className="text-sm text-luxluf-500 mb-4">
        Paste your phone notes and AI will extract the order details.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Mrs Chen from the Plaza called, wants white peonies for anniversary, $450, deliver by 2pm to suite 1201..."
        className="input min-h-[100px] resize-y"
        rows={4}
      />
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={handleParse}
          disabled={loading || !notes.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Parsing..." : "Extract Order Details"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
```

**Step 2: Create OrderForm component**

Create `src/components/OrderForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AiNotesParser from "./AiNotesParser";
import type { ParsedOrder } from "@/lib/ai";

export default function OrderForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState({
    customerName: "",
    contactInfo: "",
    conciergeHotel: "",
    productDescription: "",
    quantity: 1,
    deliveryAddress: "",
    deliveryTime: "",
    specialInstructions: "",
    orderAmount: "",
    rawNotes: "",
  });

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAiParsed(parsed: ParsedOrder) {
    setForm({
      customerName: parsed.customerName || form.customerName,
      contactInfo: parsed.contactInfo || form.contactInfo,
      conciergeHotel: parsed.conciergeHotel || form.conciergeHotel,
      productDescription: parsed.productDescription || form.productDescription,
      quantity: parsed.quantity || form.quantity,
      deliveryAddress: parsed.deliveryAddress || form.deliveryAddress,
      deliveryTime: parsed.deliveryTime
        ? new Date(parsed.deliveryTime).toISOString().slice(0, 16)
        : form.deliveryTime,
      specialInstructions: parsed.specialInstructions || form.specialInstructions,
      orderAmount: parsed.orderAmount ? String(parsed.orderAmount) : form.orderAmount,
      rawNotes: form.rawNotes,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          orderAmount: Number(form.orderAmount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || ["Failed to create order"]);
        return;
      }

      router.push(`/orders/${data.order.id}`);
    } catch (e) {
      setErrors(["Network error. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <AiNotesParser onParsed={handleAiParsed} />

      <form onSubmit={handleSubmit} className="card">
        {errors.length > 0 && (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label">Customer Name *</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Contact Info *</label>
            <input
              type="text"
              value={form.contactInfo}
              onChange={(e) => updateField("contactInfo", e.target.value)}
              className="input"
              placeholder="Phone or email"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Concierge / Hotel *</label>
            <input
              type="text"
              value={form.conciergeHotel}
              onChange={(e) => updateField("conciergeHotel", e.target.value)}
              className="input"
              placeholder="e.g. James at The Plaza"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Product Description *</label>
            <textarea
              value={form.productDescription}
              onChange={(e) => updateField("productDescription", e.target.value)}
              className="input min-h-[80px] resize-y"
              required
            />
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Order Amount (USD) *</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.orderAmount}
              onChange={(e) => updateField("orderAmount", e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Delivery Address *</label>
            <input
              type="text"
              value={form.deliveryAddress}
              onChange={(e) => updateField("deliveryAddress", e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Delivery Time *</label>
            <input
              type="datetime-local"
              value={form.deliveryTime}
              onChange={(e) => updateField("deliveryTime", e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Special Instructions</label>
            <textarea
              value={form.specialInstructions}
              onChange={(e) => updateField("specialInstructions", e.target.value)}
              className="input min-h-[60px] resize-y"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

**Step 3: Create new order page**

Create `src/app/orders/new/page.tsx`:

```tsx
import OrderForm from "@/components/OrderForm";

export default function NewOrderPage() {
  return (
    <div>
      <h1 className="text-3xl text-luxluf-800 mb-8">New Order</h1>
      <OrderForm />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/orders/new/ src/components/OrderForm.tsx src/components/AiNotesParser.tsx
git commit -m "feat: add order entry form with AI notes parsing"
```

---

## Task 12: Order Detail & Status Actions

**Files:**
- Create: `src/app/orders/[id]/page.tsx`
- Create: `src/components/StatusActions.tsx`

**Step 1: Create StatusActions component**

Create `src/components/StatusActions.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import type { Role } from "@/lib/types";
import { getAllowedTransitions } from "@/lib/roles";
import { STATUS_LABELS } from "@/lib/types";

interface Props {
  orderId: number;
  currentStatus: OrderStatus;
  role: Role;
}

export default function StatusActions({ orderId, currentStatus, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [driverName, setDriverName] = useState("");

  const transitions = getAllowedTransitions(role, currentStatus);

  if (transitions.length === 0) return null;

  async function handleTransition(newStatus: OrderStatus) {
    if (newStatus === "OUT_FOR_DELIVERY" && !driverName.trim()) {
      alert("Please enter driver name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          role,
          driverName: driverName || undefined,
        }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mt-6 border-luxluf-400">
      <h3 className="font-serif text-lg text-luxluf-800 mb-4">Actions</h3>

      {transitions.includes("OUT_FOR_DELIVERY" as OrderStatus) && (
        <div className="mb-4">
          <label className="label">Driver Name</label>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="input max-w-xs"
            placeholder="Enter your name"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {transitions.map((status) => (
          <button
            key={status}
            onClick={() => handleTransition(status)}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "Updating..." : `Mark as ${STATUS_LABELS[status]}`}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create order detail page**

Create `src/app/orders/[id]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import StatusActions from "@/components/StatusActions";
import type { Role } from "@/lib/types";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!order) notFound();

  const cookieStore = cookies();
  const role = (cookieStore.get("luxluf-role")?.value ?? "designer") as Role;

  return (
    <div>
      <a
        href="/dashboard"
        className="text-sm text-luxluf-500 hover:text-luxluf-700 transition-colors"
      >
        &larr; Back to Dashboard
      </a>

      <div className="card mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl text-luxluf-800">{order.customerName}</h1>
            <p className="text-luxluf-500 mt-1">{order.conciergeHotel}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="label">Contact</p>
            <p className="text-luxluf-900">{order.contactInfo}</p>
          </div>
          <div>
            <p className="label">Order Amount</p>
            <p className="text-luxluf-900 text-xl font-serif">
              ${Number(order.orderAmount).toLocaleString()}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="label">Product Description</p>
            <p className="text-luxluf-900">{order.productDescription}</p>
          </div>
          <div>
            <p className="label">Quantity</p>
            <p className="text-luxluf-900">{order.quantity}</p>
          </div>
          <div>
            <p className="label">Delivery Time</p>
            <p className="text-luxluf-900">
              {new Date(order.deliveryTime).toLocaleString()}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="label">Delivery Address</p>
            <p className="text-luxluf-900">{order.deliveryAddress}</p>
          </div>
          {order.specialInstructions && (
            <div className="sm:col-span-2">
              <p className="label">Special Instructions</p>
              <p className="text-luxluf-900 italic">
                {order.specialInstructions}
              </p>
            </div>
          )}
          {order.driverName && (
            <div>
              <p className="label">Driver</p>
              <p className="text-luxluf-900">{order.driverName}</p>
            </div>
          )}
          {order.deliveryPhoto && (
            <div className="sm:col-span-2">
              <p className="label">Delivery Photo</p>
              <img
                src={order.deliveryPhoto}
                alt="Delivery confirmation"
                className="mt-2 max-w-md border border-luxluf-200"
              />
            </div>
          )}
        </div>

        {order.announcementText && (
          <div className="mt-8 p-4 bg-luxluf-50 border border-luxluf-200">
            <p className="label">AI-Generated Announcement</p>
            <pre className="mt-2 whitespace-pre-wrap font-serif text-sm text-luxluf-700">
              {order.announcementText}
            </pre>
          </div>
        )}
      </div>

      <StatusActions
        orderId={order.id}
        currentStatus={order.status}
        role={role}
      />

      <div className="mt-4 text-xs text-luxluf-400">
        Created {new Date(order.createdAt).toLocaleString()} &middot;
        Updated {new Date(order.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/orders/[id]/ src/components/StatusActions.tsx
git commit -m "feat: add order detail page with role-based status actions"
```

---

## Task 13: MCP Server

**Files:**
- Create: `mcp/server.ts`
- Create: `mcp/package.json`

**Step 1: Create MCP server package**

Create `mcp/package.json`:

```json
{
  "name": "luxluf-mcp-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "npx tsx server.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@prisma/client": "^5.14.0"
  },
  "devDependencies": {
    "tsx": "^4.10.0",
    "typescript": "^5.4.0"
  }
}
```

**Step 2: Create MCP server**

Create `mcp/server.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const server = new McpServer({
  name: "luxluf-orders",
  version: "0.1.0",
});

server.tool(
  "list_orders",
  "List today's orders, optionally filtered by status",
  {
    status: z.enum([
      "SUBMITTED",
      "IN_PREPARATION",
      "PAYMENT_RECEIVED",
      "ANNOUNCED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ]).optional().describe("Filter by order status"),
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
    specialInstructions: z.string().optional().describe("Special instructions"),
    orderAmount: z.number().describe("Order amount in USD"),
  },
  async (input) => {
    const order = await prisma.order.create({
      data: {
        ...input,
        deliveryTime: new Date(input.deliveryTime),
        specialInstructions: input.specialInstructions || null,
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
    status: z.enum([
      "SUBMITTED",
      "IN_PREPARATION",
      "PAYMENT_RECEIVED",
      "ANNOUNCED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ]).describe("New status"),
    driverName: z.string().optional().describe("Driver name (for OUT_FOR_DELIVERY)"),
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
```

**Step 3: Commit**

```bash
git add mcp/
git commit -m "feat: add MCP server for Claude Code order management integration"
```

---

## Task 14: OpenAPI Documentation

**Files:**
- Create: `src/app/api/docs/route.ts`

**Step 1: Create OpenAPI spec endpoint**

Create `src/app/api/docs/route.ts`:

```typescript
import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "LUXLUF Order Management API",
    version: "1.0.0",
    description:
      "REST API for managing same-day floral orders at LUXLUF Event Flowers NYC. AI-enabled with order parsing and announcement generation.",
  },
  paths: {
    "/api/orders": {
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
          { name: "date", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": { description: "List of orders" },
        },
      },
      post: {
        summary: "Create order",
        description: "Create a new order. Triggers email notification to designers.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderInput" },
            },
          },
        },
        responses: {
          "201": { description: "Order created" },
          "400": { description: "Validation errors" },
        },
      },
    },
    "/api/orders/{id}": {
      get: {
        summary: "Get order",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Order details" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/orders/{id}/status": {
      patch: {
        summary: "Update order status",
        description:
          "Transition order status. If transitioning to PAYMENT_RECEIVED, AI generates announcement text and emails receptionist.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
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
    "/api/orders/parse": {
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
                  notes: { type: "string", description: "Raw phone call notes" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Parsed order data" },
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
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
```

**Step 2: Commit**

```bash
git add src/app/api/docs/
git commit -m "feat: add OpenAPI 3.1 spec endpoint at /api/docs"
```

---

## Task 15: Final Verification & Build

**Step 1: Run all tests**

```bash
npm test
```
Expected: All tests pass

**Step 2: Run linter**

```bash
npm run lint
```
Expected: No errors

**Step 3: Build the project**

```bash
npm run build
```
Expected: Build succeeds

**Step 4: Fix any issues found in steps 1-3**

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: fix any build/lint/test issues"
```

---

## Execution Summary

| Task | Description | Key Files |
|---|---|---|
| 1 | Testing setup + cn utility | vitest.config.ts, src/lib/utils.ts |
| 2 | Prisma schema + seed data | prisma/schema.prisma, prisma/seed.ts |
| 3 | Types + role permissions | src/lib/types.ts, src/lib/roles.ts |
| 4 | AI services (parsing + announcements) | src/lib/ai.ts |
| 5 | Email service (designer + receptionist) | src/lib/email.ts |
| 6 | Server Actions (order CRUD) | src/lib/actions/orders.ts |
| 7 | REST API routes | src/app/api/orders/ |
| 8 | Layout + global styles | src/app/layout.tsx, globals.css |
| 9 | Role selector landing page | src/app/page.tsx |
| 10 | Order dashboard | src/app/dashboard/page.tsx |
| 11 | Order form + AI parsing UI | src/app/orders/new/page.tsx |
| 12 | Order detail + status actions | src/app/orders/[id]/page.tsx |
| 13 | MCP server | mcp/server.ts |
| 14 | OpenAPI documentation | src/app/api/docs/route.ts |
| 15 | Final verification + build | — |
