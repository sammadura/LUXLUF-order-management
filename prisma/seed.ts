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
        productDescription:
          "Grand centerpiece arrangement - white peonies, garden roses, eucalyptus",
        quantity: 1,
        deliveryAddress: "The Plaza Hotel, 768 5th Ave, Suite 1201",
        deliveryTime: today(14, 0),
        specialInstructions:
          "Guest is celebrating anniversary. Include handwritten card.",
        orderAmount: 450.0,
        status: OrderStatus.SUBMITTED,
      },
      {
        customerName: "Mr. & Mrs. Park",
        contactInfo: "646-555-0202",
        conciergeHotel: "Sofia at The Peninsula",
        productDescription:
          "6 low arrangements for dinner table - blush pink roses, ranunculus",
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
        productDescription:
          "Bridal suite arrangement - cascading orchids, white lilies, trailing ivy",
        quantity: 1,
        deliveryAddress: "The St. Regis, 2 E 55th St, Bridal Suite 4200",
        deliveryTime: today(11, 0),
        specialInstructions:
          "FRAGILE - no strong scents, bride has allergies. Coordinate with wedding planner Sarah at 917-555-0303.",
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
