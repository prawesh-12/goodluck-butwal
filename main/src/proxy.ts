import { NextResponse, type NextRequest } from "next/server";
import { lookupRedirect } from "@/lib/seo/redirects";

// Cookie presence only, so no auth library is pulled in here. The admin layout reads the real
// session and turns away anyone expired or deactivated.
const COOKIE = "better-auth.session_token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A renamed slug leaves a 301 behind, and this is what serves it.
  const rule = await lookupRedirect(pathname);
  if (rule) {
    return NextResponse.redirect(new URL(rule.to, request.url), rule.status);
  }

  // Both are for someone who cannot sign in yet, so neither can require a session.
  const openToAnyone = pathname === "/admin/login" || pathname === "/admin/reset-password";

  if (pathname.startsWith("/admin") && !openToAnyone) {
    const signedIn = request.cookies.has(COOKIE) || request.cookies.has(`__Secure-${COOKIE}`);
    if (!signedIn) return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Pages only. A redirect is for URLs people follow, and the API must never answer with a 301.
  matcher: ["/((?!api|_next/static|_next/image|images|brand|videos|favicon.ico|robots.txt|sitemap.xml).*)"],
};
