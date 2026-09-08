import { NextResponse, type NextRequest } from "next/server";

// Presence of the cookie only, so the edge stays cheap and middleware pulls in no library.
// The admin layout reads the real session and turns away anyone expired or deactivated.
const COOKIE = "better-auth.session_token";

export function middleware(request: NextRequest) {
  const signedIn =
    request.cookies.has(COOKIE) || request.cookies.has(`__Secure-${COOKIE}`);
  if (signedIn) return NextResponse.next();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/((?!login).*)"],
};
