import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobalV2) {
    global.prismaGlobalV2 = new PrismaClient();
  }
}

const prisma = global.prismaGlobalV2 ?? new PrismaClient();

export default prisma;
