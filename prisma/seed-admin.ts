import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "jziegenhorn@teamexpansion.org";
/** Bcrypt hash for default seeded password when ADMIN_PASSWORD is unset — matches prisma/seed.ts */
const DEFAULT_PASSWORD_HASH =
  "$2b$10$.Z8p8MKCbJNkm/qfMpavxOfLQlNZz6dhsXonuNakwEbSfFu5SE5YC";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim() || DEFAULT_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD?.trim()
    ? await hash(process.env.ADMIN_PASSWORD.trim(), 10)
    : DEFAULT_PASSWORD_HASH;

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
    update: {
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("Admin user ready:", user.email, "(role:", user.role, ")");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
