import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function GET() {
  try {
    const status = await fetchQuery(api.seedDatabase.checkDatabaseStatus, {});
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error checking database status:", error);
    return NextResponse.json(
      { error: "Failed to check database status" },
      { status: 500 }
    );
  }
}
