import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Защищённые роуты (требуют авторизации)
const protectedRoutes = ["/", "/route", "/boxes", "/history", "/profile"];

// Публичные роуты (доступны без авторизации)
const authRoutes = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем наличие токена в cookies
  const token = request.cookies.get("sb-access-token")?.value;

  // Если пользователь НЕ авторизован
  if (!token) {
    // Если пытается попасть на защищённый роут → redirect на login
    if (protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
      // Проверяем, что мы уже не на странице логина (предотвращаем цикл)
      if (!authRoutes.some((route) => pathname.startsWith(route))) {
        const loginUrl = new URL("/auth/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // Если пользователь авторизован
  if (token) {
    // Если пытается попасть на auth страницы → redirect на главную
    if (authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
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
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};