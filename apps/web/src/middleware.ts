import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: unknown }) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    const isAuthRoute = pathname === "/login" || pathname === "/signup";
    const isRootRoute = pathname === "/" || pathname === "/dashboard";

    // If logged in, don't allow access to login/signup
    if (isLoggedIn && (isAuthRoute || isRootRoute)) {
        return NextResponse.redirect(new URL("/portfolios", req.url));
    }

    const isProtectedRoute = pathname.startsWith("/simulation") ||
        pathname.startsWith("/backtests") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/portfolios") ||
        pathname.startsWith("/dashboard");

    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
