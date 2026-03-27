import { NextRequest, NextResponse } from "next/server";

/**
 * Account Name Enquiry via Interswitch Marketplace Routing API.
 *
 * Uses QA credentials — the same ones that power the banks-list endpoint.
 * The Marketplace Routing base URL hosts both:
 *   /verify/identity/account-number/bank-list   (GET  — bank list)
 *   /verify/identity/account-number/resolve      (POST — name enquiry)
 */

const ISW_MR_BASE =
  "https://api-marketplace-routing.k8.isw.la/marketplace-routing/api/v1";
const TOKEN_URL = "https://qa.interswitchng.com/passport/oauth/token";

async function getToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.INTERSWITCH_CLIENT_ID}:${process.env.INTERSWITCH_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=profile",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`ISW token failed (${res.status}):`, err);
    throw new Error(`Interswitch token error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "accountNumber and bankCode are required" },
        { status: 400 },
      );
    }

    const token = await getToken();

    // Marketplace Routing resolve — same base URL as the working bank-list
    const resolveUrl = `${ISW_MR_BASE}/verify/identity/account-number/resolve`;

    console.log("ISW resolve request →", { accountNumber, bankCode, resolveUrl });

    const res = await fetch(resolveUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountNumber, bankCode }),
    });

    const raw = await res.text();
    console.log(`ISW resolve response (${res.status}):`, raw);

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            "Could not verify account. Please check the account number and bank.",
          details: raw,
        },
        { status: res.status },
      );
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Invalid response from Interswitch." },
        { status: 502 },
      );
    }

    // Try every known field name Interswitch might return
    const accountName =
      data.accountName ||
      data.AccountName ||
      data.account_name ||
      data.data?.accountName ||
      data.data?.account_name ||
      "";

    if (!accountName) {
      return NextResponse.json(
        { error: "Account not found. Please check your details." },
        { status: 404 },
      );
    }

    return NextResponse.json({ accountName });
  } catch (err: any) {
    console.error("ISW resolve error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
