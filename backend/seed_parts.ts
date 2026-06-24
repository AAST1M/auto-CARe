import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.sparePart.createMany({
    data: [
      {
        name: "Bosch Premium Brake Pads",
        category: "Brakes",
        price: 850,
        stock: 12,
        condition: "New",
        image: "https://picsum.photos/400/300?brakes"
      },
      {
        name: "Michelin Pilot Sport 4 (225/45 R17)",
        category: "Tires",
        price: 4500,
        stock: 8,
        condition: "New",
        image: "https://picsum.photos/400/300?tire"
      },
      {
        name: "VARTA Silver Dynamic Battery 70Ah",
        category: "Batteries",
        price: 3200,
        stock: 5,
        condition: "New",
        image: "https://picsum.photos/400/300?battery"
      },
      {
        name: "Mobil 1 Advanced Full Synthetic 5W-30",
        category: "Oil",
        price: 1200,
        stock: 20,
        condition: "New",
        image: "https://picsum.photos/400/300?oil"
      },
      {
        name: "OEM Spark Plugs (Set of 4)",
        category: "Engine",
        price: 600,
        stock: 15,
        condition: "New",
        image: "https://picsum.photos/400/300?spark"
      },
      {
        name: "Suspension Control Arm",
        category: "Body",
        price: 1500,
        stock: 5,
        condition: "New",
        image: "https://picsum.photos/400/300?suspension",
        compatibilityModel: "Honda Civic",
        compatibilityYearStart: 2019,
        compatibilityYearEnd: 2022
      }
    ]
  });
  console.log("Seeded spare parts!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
