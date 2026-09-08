import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Only checks that a session cookie exists, so the edge stays cheap. The admin layout loads the
// real session and turns away anyone deactivated.
export function middleware(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const login = new URL("/admin/login", request.url);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/((?!login).*)"],
};
