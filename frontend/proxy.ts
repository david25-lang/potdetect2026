import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload-image/:path*",
    "/upload-video/:path*",
    "/history/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
