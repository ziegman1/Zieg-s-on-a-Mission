import { PrismaClient } from "@prisma/client";
import { ensureAdminUsers } from "./ensure-admin-users";

const prisma = new PrismaClient();

async function main() {
  await ensureAdminUsers(prisma);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
