import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import StatusActions from "@/components/StatusActions";
import type { Role } from "@/lib/types";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
  });

  if (!order) notFound();

  const cookieStore = await cookies();
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
        Created {new Date(order.createdAt).toLocaleString()} &middot; Updated{" "}
        {new Date(order.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
