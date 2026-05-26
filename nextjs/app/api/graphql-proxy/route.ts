import { NextRequest, NextResponse } from "next/server";

const WIKIJS_GRAPHQL_URL = process.env.WIKIJS_GRAPHQL_URL!;
const WIKIJS_SERVICE_TOKEN = process.env.WIKIJS_SERVICE_TOKEN!;

// Server-side proxy so the service token never reaches the browser
export async function POST(req: NextRequest) {
  const body = await req.text();

  const upstream = await fetch(WIKIJS_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WIKIJS_SERVICE_TOKEN}`,
    },
    body,
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
