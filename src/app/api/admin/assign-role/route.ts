import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Check if the current user is authenticated
    const { userId: currentUserId } = await auth();

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the current user is an admin
    const client = await clerkClient();
    const currentUser = await client.users.getUser(currentUserId);
    const currentUserRole = currentUser.publicMetadata?.role;

    if (currentUserRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse the request body
    const { userId, makeAdmin } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Update the user's role in Clerk metadata
    const targetUser = await client.users.getUser(userId);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the user's public metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        role: makeAdmin ? "admin" : "user",
        adminLevel: makeAdmin ? "super" : undefined,
      },
    });

    const action = makeAdmin ? "assigned" : "removed";
    const message = `Successfully ${action} admin role ${makeAdmin ? "to" : "from"} ${targetUser.emailAddresses[0]?.emailAddress}`;

    return NextResponse.json({
      success: true,
      message,
      userId,
      isAdmin: makeAdmin,
    });
  } catch (error) {
    console.error("Error in assign-role API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
