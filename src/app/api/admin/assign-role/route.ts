import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  assignAdminRole,
  removeAdminRole,
} from "@/lib/adminServerAuth";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUserId = await requireAdmin();

    const body = await request.json();
    const { userId, makeAdmin } = body;

    if (!userId || typeof makeAdmin !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Assign or remove admin role
    const success = makeAdmin
      ? await assignAdminRole(userId)
      : await removeAdminRole(userId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Admin role ${makeAdmin ? "assigned" : "removed"} successfully`,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to update admin role" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in admin role assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
