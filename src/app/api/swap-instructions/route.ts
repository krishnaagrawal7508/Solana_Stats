import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Parse the request body as JSON

  const body = await request.json();
  const response = await fetch(`https://quote-api.jup.ag/v6/swap-instructions`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quoteResponse: body?.swapData, // Use swapData from the request body
      userPublicKey: body?.key, // Use key from the request body
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}