import type { Order } from "@prisma/client";
import StatusBadge from "./StatusBadge";

export default function OrderCard({ order }: { order: Order }) {
  return (
    <a
      href={`/orders/${order.id}`}
      className="card block group hover:border-luxluf-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg text-luxluf-800 truncate group-hover:text-luxluf-600 transition-colors">
            {order.customerName}
          </h3>
          <p className="text-sm text-luxluf-500 mt-0.5">
            {order.conciergeHotel}
          </p>
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
