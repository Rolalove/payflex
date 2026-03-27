import { NextResponse } from "next/server";

const ISW_BASE_URL =
  "https://api-marketplace-routing.k8.isw.la/marketplace-routing/api/v1";

async function getInterswitchToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.INTERSWITCH_CLIENT_ID}:${process.env.INTERSWITCH_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(`https://qa.interswitchng.com/passport/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=profile",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Token request failed with status ${res.status}:`, err);
    throw new Error(`Interswitch token error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function GET() {
  try {
    const token = await getInterswitchToken();

    const res = await fetch(
      `${ISW_BASE_URL}/verify/identity/account-number/bank-list`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    // Interswitch Marketplace Routing returns banks in data.data array
    const banks = data.data || [];
    console.log(`Successfully fetched ${banks.length} banks from Interswitch`);
    return NextResponse.json({ banks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
