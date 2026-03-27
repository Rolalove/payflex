import { NextRequest, NextResponse } from "next/server";

const ISW_SANDBOX_URL = "https://sandbox.interswitchng.com";

async function getSandboxToken(): Promise<string> {
  const clientId = process.env.INTERSWITCH_SANDBOX_CLIENT_ID;
  const clientSecret = process.env.INTERSWITCH_SANDBOX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Interswitch sandbox credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const res = await fetch(`${ISW_SANDBOX_URL}/passport/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Sandbox token request failed (${res.status}):`, err);
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

    const token = await getSandboxToken();

    console.log("Verifying account via Quickteller:", {
      accountNumber,
      bankCode,
    });

    // Quickteller Name Enquiry — works for all banks & fintechs
    const url = `${ISW_SANDBOX_URL}/api/v2/quickteller/payments/banks/account/query?accountNumber=${accountNumber}&bankCode=${bankCode}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        TerminalID: process.env.INTERSWITCH_TERMINAL_ID || "3PBL0001",
      },
    });

    console.log(`Quickteller verify response status: ${res.status}`);

    if (!res.ok) {
      const err = await res.text();
      console.error(
        `Quickteller verify failed (${res.status}):`,
        err,
        "Params:",
        { accountNumber, bankCode },
      );
      return NextResponse.json(
        {
          error:
            "Could not verify account. Please check the account number and bank.",
          details: err,
        },
        { status: res.status },
      );
    }

    const data = await res.json();
    console.log("Quickteller verify response:", data);

    const accountName =
      data.accountName ||
      data.AccountName ||
      data.account_name ||
      data.data?.accountName ||
      "";

    if (!accountName) {
      return NextResponse.json(
        { error: "Account not found. Please check your details." },
        { status: 404 },
      );
    }

    return NextResponse.json({ accountName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

