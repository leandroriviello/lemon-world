import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { finalPayload } = await req.json();
    const ok =
      finalPayload &&
      finalPayload.status === 'success' &&
      typeof finalPayload.txHash === 'string' &&
      finalPayload.txHash.length > 0;

    if (!ok) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Optionally, you could persist or verify the reference here.
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
