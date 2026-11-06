import type { NextRequest } from "next/server";

export async function GET(_request: NextRequest, _context: { params: Promise<{ id: string }> }): Promise<Response> {
  throw new Error("Not implemented: GET /api/items/:id");
}
