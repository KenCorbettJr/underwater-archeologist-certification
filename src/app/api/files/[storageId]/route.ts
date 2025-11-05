import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storageId: string }> }
) {
  try {
    const { storageId } = await params;

    // Get the file URL from Convex storage
    const fileUrl = await convex.query(api.fileStorage.getFileUrl, {
      storageId: storageId as any,
    });

    if (!fileUrl) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Redirect to the actual file URL
    return NextResponse.redirect(fileUrl);
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
