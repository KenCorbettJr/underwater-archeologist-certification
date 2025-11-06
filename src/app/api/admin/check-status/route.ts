import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    // Check if the current user is authenticated
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        isAuthenticated: false,
        isAdmin: false,
        user: null,
      });
    }

    // Get user details from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user.publicMetadata?.role;
    const isAdmin = role === "admin";

    return NextResponse.json({
      isAuthenticated: true,
      isAdmin,
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username ||
          "Unknown",
        role: role || "user",
        metadata: user.publicMetadata,
      },
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
