import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes - accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/api/webhooks(.*)",
]);

// Role-based route matchers
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isHodRoute = createRouteMatcher(["/hod(.*)"]);
const isProfessorRoute = createRouteMatcher(["/professor(.*)"]);
const isStudentRoute = createRouteMatcher(["/student(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign-in
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Get user role from session claims (set via Clerk metadata)
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Role-based access control
  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isHodRoute(req) && role !== "hod") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isProfessorRoute(req) && role !== "professor") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isStudentRoute(req) && role !== "student") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
