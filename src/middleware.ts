// ВРЕМЕННО ПОЛНОСТЬЮ ОТКЛЮЧЕНО ДЛЯ ТЕСТИРОВАНИЯ
// Все запросы проходят без проверки авторизации и ролей

import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("🔓 Middleware: FULLY DISABLED - All requests allowed");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};