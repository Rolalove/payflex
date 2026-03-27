import { NextRequest, NextResponse } from "next/server";

const ISW_BASE_URL = "https://sandbox.interswitchng.com";

async function getInterswitchToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.INTERSWITCH_SANDBOX_CLIENT_ID}:${process.env.INTERSWITCH_SANDBOX_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${ISW_BASE_URL}/passport/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Interswitch token error: ${err}`);
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
        { status: 400 }
      );
    }

    const token = await getInterswitchToken();

    const url = `${ISW_BASE_URL}/api/v2/quickteller/payments/banks/account/query?accountNumber=${accountNumber}&bankCode=${bankCode}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        TerminalID: process.env.INTERSWITCH_TERMINAL_ID || "",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "Could not verify account. Please check the account number and bank." },
        { status: res.status }
      );
    }

    const data = await res.json();
    // Interswitch returns accountName in different fields depending on version
    const accountName =
      data.accountName || data.AccountName || data.account_name || "";

    if (!accountName) {
      return NextResponse.json(
        { error: "Account not found. Please check your details." },
        { status: 404 }
      );
    }

    return NextResponse.json({ accountName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
