# LUXLUF Order Management - Phase 1 MVP Design

**Date:** 2026-02-14
**Status:** Approved
**Author:** Claude (brainstorming skill)

## Problem

LUXLUF Event Flowers NYC processes same-day floral orders via phone with no centralized tracking. Information lives in Slack, handwritten notes, and the receptionist's memory.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Authentication | None for MVP | Small trusted team, internal tool. Add auth in Phase 2. |
| Designer notification | Email (Resend) | Team preference. 100 emails/day free tier is sufficient. |
| Drivers per order | One | Simplest model for MVP. Covers 100% of current workflow. |
| Database | Vercel Postgres (Neon) | Required for Vercel deployment. Same DB for dev and prod. |
| Deployment | Vercel | Free tier, native Next.js support. |

## Data Model

Single `Order` table:

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Int (auto-increment) | auto | Primary key |
| customerName | String | yes | |
| contactInfo | String | yes | Phone or email |
| conciergeHotel | String | yes | Requesting concierge + hotel |
| productDescription | String | yes | What they want |
| quantity | Int | yes | Default 1 |
| deliveryAddress | String | yes | |
| deliveryTime | DateTime | yes | |
| specialInstructions | String | no | |
| orderAmount | Decimal | yes | In USD |
| status | Enum | yes | See status flow below |
| driverName | String | no | Set when driver picks up |
| deliveryPhoto | String | no | URL from Vercel Blob |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**OrderStatus enum:** SUBMITTED, IN_PREPARATION, PAYMENT_RECEIVED, ANNOUNCED, OUT_FOR_DELIVERY, DELIVERED

## Status Flow

```
SUBMITTED → IN_PREPARATION → PAYMENT_RECEIVED → ANNOUNCED → OUT_FOR_DELIVERY → DELIVERED
```

- SUBMITTED → IN_PREPARATION: Designer starts work
- IN_PREPARATION → PAYMENT_RECEIVED: Hailey confirms payment
- PAYMENT_RECEIVED → ANNOUNCED: Receptionist sends announcement
- ANNOUNCED → OUT_FOR_DELIVERY: Driver picks up
- OUT_FOR_DELIVERY → DELIVERED: Driver confirms + uploads photo

**Email triggers:**
- On SUBMITTED: Email to designers with full order details
- On PAYMENT_RECEIVED: Email to receptionist with pre-filled announcement info

## Page Structure

| Route | Purpose | Role |
|---|---|---|
| `/` | Role selector landing page | All |
| `/dashboard` | Active same-day orders with status filters | All (view adapts) |
| `/orders/new` | Order entry form | Hailey |
| `/orders/[id]` | Order detail + status actions | All (actions differ) |

## Role-Based UI

Role stored in cookie (no auth). UI shows/hides actions based on selected role.

| Role | Create orders | Status transitions |
|---|---|---|
| Hailey | Yes | All |
| Receptionist | No | PAYMENT_RECEIVED → ANNOUNCED |
| Designer | No | SUBMITTED → IN_PREPARATION |
| Driver | No | ANNOUNCED → OUT_FOR_DELIVERY, OUT_FOR_DELIVERY → DELIVERED |

## UI Direction

- **Tone:** Refined, warm, editorial — luxury floral brand
- **Palette:** luxluf earth tones (warm browns: #faf8f5 to #574136)
- **Typography:** Serif (Georgia) for headings, clean sans for body
- **Layout:** Generous whitespace, card-based dashboard, mobile-first
- **Avoid:** Generic blue buttons, cookie-cutter dashboards, AI slop aesthetics

## AI-Enabled Features

### AI Order Parsing
Hailey pastes rough phone notes into a text area → Claude API extracts structured fields (customer name, hotel, product, address, delivery time, amount, special instructions) → pre-fills the order form. Hailey reviews and submits.

### AI-Generated Hard Announcements
When order reaches PAYMENT_RECEIVED status, Claude API auto-generates a formatted hard announcement with delivery details, product specs, and amount. Receptionist reviews and sends with one click.

### API-First Architecture
Every order operation is available as both:
- **Server Action** (for the Next.js UI)
- **REST API endpoint** (for AI agents, automations, and external tools)

API routes under `/api/orders/` with JSON request/response.

### MCP Server
A Model Context Protocol server exposing tools for:
- `list_orders` — query orders by status, date, customer
- `get_order` — get full order details by ID
- `create_order` — create a new order
- `update_order_status` — transition order status
- `parse_order_notes` — AI-parse raw notes into structured order data

This allows Claude Code to manage orders directly from the terminal.

### OpenAPI Documentation
Auto-generated OpenAPI 3.1 spec from API routes, served at `/api/docs`.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + luxluf palette |
| Database | Vercel Postgres via Prisma |
| AI | Anthropic SDK (@anthropic-ai/sdk) |
| Email | Resend |
| Photo storage | Vercel Blob |
| MCP | @modelcontextprotocol/sdk |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |
