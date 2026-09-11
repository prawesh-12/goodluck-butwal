import { test, expect } from "vitest";
import { auth } from "@/lib/auth";

const hasDb = Boolean(process.env.DATABASE_URL);

const body = {
  name: "Someone Uninvited",
  email: "uninvited@example.test",
  password: "averylongpassword123",
};

// The endpoint was reachable from the internet and handed out a working member account
// to anyone who posted to it. Only an administrator creates accounts now.
test.runIf(hasDb)("signing up over http is refused", async () => {
  const request = new Request("http://localhost/api/auth/sign-up/email", { method: "POST" });

  await expect(auth.api.signUpEmail({ body, request })).rejects.toThrow();
});
