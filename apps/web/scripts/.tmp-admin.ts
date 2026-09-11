import { auth } from "@/lib/auth";
import { db } from "@goodluck/db";
import { users } from "@goodluck/db/schema";
import { eq } from "drizzle-orm";
async function main() {
  const email = "audit-admin@example.test";
  try {
    await auth.api.signUpEmail({ body: { name: "Audit Admin", email, password: "auditpassword12345" } });
  } catch (e) { console.log("signup:", (e as Error).message); }
  await db.update(users).set({ role: "super_admin", isActive: true }).where(eq(users.email, email));
  const rows = await db.select({ e: users.email, r: users.role, a: users.isActive }).from(users).where(eq(users.email, email));
  console.log("admin:", JSON.stringify(rows));
}
void main();
