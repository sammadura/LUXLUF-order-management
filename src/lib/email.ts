import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

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
        New Order &mdash; ${order.customerName}
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

export function buildReceptionistEmailHtml(
  order: AnnouncementEmailData
): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #825d4a; border-bottom: 2px solid #e0d5c6; padding-bottom: 12px;">
        Payment Received &mdash; Ready for Announcement
      </h1>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Customer</td><td>${order.customerName}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Hotel/Concierge</td><td>${order.conciergeHotel}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Amount</td><td>$${order.orderAmount}</td></tr>
        <tr><td style="padding: 8px 0; color: #6a4d40; font-weight: bold;">Delivery</td><td>${order.deliveryAddress} by ${order.deliveryTime.toLocaleString()}</td></tr>
      </table>
      ${
        order.announcementText
          ? `
        <div style="margin-top: 24px; padding: 16px; background: #faf8f5; border-left: 4px solid #a98464;">
          <h3 style="color: #574136; margin-top: 0;">AI-Generated Announcement (review before sending)</h3>
          <pre style="white-space: pre-wrap; font-family: Georgia, serif; color: #6a4d40;">${order.announcementText}</pre>
        </div>
      `
          : ""
      }
    </div>
  `;
}

export async function sendDesignerNotification(order: OrderEmailData) {
  const emails = (process.env.DESIGNER_EMAILS ?? "").split(",").filter(Boolean);
  if (emails.length === 0) return;

  await getResend().emails.send({
    from: "LUXLUF Orders <orders@luxluf.com>",
    to: emails,
    subject: `New Order: ${order.customerName} — ${order.productDescription.slice(0, 50)}`,
    html: buildDesignerEmailHtml(order),
  });
}

export async function sendReceptionistNotification(
  order: AnnouncementEmailData
) {
  const email = process.env.RECEPTIONIST_EMAIL;
  if (!email) return;

  await getResend().emails.send({
    from: "LUXLUF Orders <orders@luxluf.com>",
    to: [email],
    subject: `Payment Received — ${order.customerName} — Ready for Announcement`,
    html: buildReceptionistEmailHtml(order),
  });
}
