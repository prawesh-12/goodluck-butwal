import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { users, sessions, accounts, verifications } from "@db/schema";
import { sendEmail } from "@/lib/email";

const WEEK = 60 * 60 * 24 * 7;
const DAY = 60 * 60 * 24;
const FIFTEEN_MINUTES = 60 * 15;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    // An admin creating an account must not be signed out of their own.
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Goodluck admin password",
        html: `<p>Someone asked to reset the password for this account.</p>
<p><a href="${url}">Choose a new password</a>. The link works once and expires in an hour.</p>
<p>If it was not you, ignore this and nothing changes.</p>`,
      });
    },
  },

  // Rolling: a week from last use, refreshed at most once a day.
  session: { expiresIn: WEEK, updateAge: DAY },

  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "content_editor", input: false },
      officeId: { type: "string", required: false, input: false },
      isActive: { type: "boolean", defaultValue: true, input: false },
    },
  },

  rateLimit: {
    enabled: true,
    window: FIFTEEN_MINUTES,
    max: 100,
    customRules: {
      "/sign-in/email": { window: FIFTEEN_MINUTES, max: 5 },
      "/request-password-reset": { window: FIFTEEN_MINUTES, max: 5 },
      "/forget-password": { window: FIFTEEN_MINUTES, max: 5 },
    },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const [account] = await db
            .select({ isActive: users.isActive })
            .from(users)
            .where(eq(users.id, session.userId));

          if (!account?.isActive) {
            throw new APIError("FORBIDDEN", { message: "This account has been deactivated." });
          }
          return { data: session };
        },
      },
    },
  },

  hooks: {
    // Signup is how an admin creates a colleague's account, never something a visitor may do.
    // disableSignUp would also block createUser, so the block is on the HTTP route only: a direct
    // auth.api call carries no request object, an incoming one does.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email" && ctx.request) {
        throw new APIError("FORBIDDEN", { message: "An administrator creates accounts." });
      }
    }),
  },

  plugins: [nextCookies()],
});
