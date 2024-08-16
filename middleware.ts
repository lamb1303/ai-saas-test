import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/settings(.*)",
  "/code(.*)",
  "/conversation(.*)",
  "/image(.*)",
  "/music(.*)",
  "/video(.*)",
]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks/(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isWebhookRoute(req)) {
    // Allow webhook routes to proceed without authentication
    return NextResponse.next();
  }
  if (!auth().userId && isProtectedRoute(req)) {
    return auth().redirectToSignIn();
  } else {
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
