import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY =
  process.env.AUTH_SECRET ||
  "expense_tracker_secure_super_secret_session_key_2026_dev";
const encodedKey = new TextEncoder().encode(SECRET_KEY);
const SESSION_COOKIE_NAME = "salary_tracker_session";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Если принудительно сбрасывается сессия (например, сменилась БД и пользователь в ней не существует)
  if (request.nextUrl.searchParams.get("clear") === "1") {
    const cleanUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isAuthenticated = false;

  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, encodedKey, {
        algorithms: ["HS256"],
      });
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // Роут / - перенаправляем на dashboard если залогинен, иначе на login
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Если пользователь уже авторизован и заходит на страницы логина/регистрации
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Защищенные роуты
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
