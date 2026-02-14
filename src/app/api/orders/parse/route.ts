import { NextRequest, NextResponse } from "next/server";
import { parseOrderNotes } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const { notes } = await request.json();

  if (!notes?.trim()) {
    return NextResponse.json(
      { error: "notes field is required" },
      { status: 400 }
    );
  }

  try {
    const parsed = await parseOrderNotes(notes);
    return NextResponse.json({ parsed });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse order notes" },
      { status: 500 }
    );
  }
}
