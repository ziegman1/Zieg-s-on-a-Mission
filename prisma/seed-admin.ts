import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_EMAIL = "jziegenhorn@teamexpansion.org";
/** Bcrypt fallback when ADMIN_PASSWORD is unset; keep in sync with prisma/seed.ts */
const DEFAULT_PASSWORD_HASH =
  "$2b$10$W9Rv49gJroSuk3jcgG0DTef41Tpl0ouqMINlRBpYwdHc6.HVMlDw.";

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL?.trim() || DEFAULT_EMAIL).toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD?.trim()
    ? await hash(process.env.ADMIN_PASSWORD.trim(), 10)
    : DEFAULT_PASSWORD_HASH;

  const existing = await prisma.user.findFirst({
    where: { email: { equals: adminEmail, mode: "insensitive" } },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { email: adminEmail, passwordHash, role: "ADMIN" },
    });
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        passwordHash,
        role: "ADMIN",
      },
    });
  }
  console.log("Admin user ready:", adminEmail, "(role: ADMIN)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
