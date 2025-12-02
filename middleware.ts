import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define admin routes that require admin authentication
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/admin/setup",
  "/api/admin/database-status",
  "/api/admin/seed-database",
  "/challenges(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Require authentication for non-public routes
  if (!userId) {
    // Redirect to home page where Clerk modal will handle sign-in
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Check admin routes
  if (isAdminRoute(req)) {
    try {
      // Import the admin auth function dynamically to avoid circular imports
      const { isUserAdmin } = await import("./src/lib/adminServerAuth");
      const isAdmin = await isUserAdmin(userId);

      if (!isAdmin) {
        // Redirect non-admin users to home page
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      console.error("Error checking admin status in middleware:", error);
      // On error, redirect to home for safety
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
