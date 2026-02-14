import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import OrderCard from "@/components/OrderCard";
import StatusFilter from "@/components/StatusFilter";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statusFilter = statusParam as OrderStatus | undefined;

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
          <h1 className="text-3xl text-luxluf-800">Today&apos;s Orders</h1>
          <p className="text-sm text-luxluf-500 mt-1">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <a href="/orders/new" className="btn-primary">
          New Order
        </a>
      </div>
      <Suspense>
        <StatusFilter />
      </Suspense>
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
