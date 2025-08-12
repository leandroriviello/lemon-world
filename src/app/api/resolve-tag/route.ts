import { NextResponse } from "next/server";

const TEST_MAP: Record<string, string> = {
  leandrotest: "0x1111111111111111111111111111111111111111",
  lemondev:    "0x2222222222222222222222222222222222222222",
  demo:        "0x3333333333333333333333333333333333333333",
};

export async function POST(req: Request) {
  const { tag } = (await req.json()) as { tag?: string };
  if (!tag) return NextResponse.json({ error: "missing tag" }, { status: 400 });

  const clean = tag.trim().replace(/^@/, "").toLowerCase();

  if (process.env.MOCK_MODE === "true") {
    const address = TEST_MAP[clean];
    if (!address) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ address });
  }

  // Aquí luego llamamos a la API real de Lemon y devolvemos { address }
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}