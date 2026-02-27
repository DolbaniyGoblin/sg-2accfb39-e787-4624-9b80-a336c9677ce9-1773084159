import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Защищённые роуты (требуют авторизации)
const protectedRoutes = ["/", "/route", "/boxes", "/history", "/profile"];

// Публичные роуты (доступны без авторизации)
const authRoutes = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const res = NextResponse.next();

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = !!session;

  // Если пользователь НЕ авторизован
  if (!isAuthenticated) {
    // Если пытается попасть на защищённый роут → redirect на login
    if (protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Если пользователь авторизован
  if (isAuthenticated) {
    // Если пытается попасть на auth страницы → redirect на главную
    if (authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return res;
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