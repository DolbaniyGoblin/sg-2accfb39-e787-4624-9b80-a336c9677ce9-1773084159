import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("🔐 Middleware: Processing request for:", request.nextUrl.pathname);
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  console.log("🔐 Middleware: Session exists:", !!session);

  // Public routes that don't require authentication
  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/register-admin",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/setup-admin",
    "/setup-admin-password",
    "/api/admin/reset-password",
    "/api/test-reset-password"
  ];
  const isPublicRoute = publicPaths.some(route => request.nextUrl.pathname.startsWith(route));
  console.log("🔐 Middleware: Is public route:", isPublicRoute);

  // Redirect to login if not authenticated and trying to access protected route
  if (!session && !isPublicRoute) {
    console.log("🔐 Middleware: No session, redirecting to login");
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based access control for authenticated users
  if (session) {
    console.log("🔐 Middleware: Checking user role for protected routes");
    
    // КРИТИЧНО: Берём роль из user_metadata, а не из таблицы users
    const userRole = session.user.user_metadata?.role || "courier";
    console.log("🔐 Middleware: User role from metadata:", userRole);

    if (request.nextUrl.pathname.startsWith("/admin") && userRole !== "admin") {
      console.log("🔐 Middleware: Non-admin trying to access admin route");
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (request.nextUrl.pathname.startsWith("/dispatcher") && 
        userRole !== "dispatcher" && 
        userRole !== "admin") {
      console.log("🔐 Middleware: Non-dispatcher trying to access dispatcher route");
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  console.log("🔐 Middleware: Allowing request to proceed");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};