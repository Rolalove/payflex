import { NextRequest, NextResponse } from "next/server";

const ISW_BASE_URL = "https://sandbox.interswitchng.com";

function isConfigured() {
  const id = process.env.INTERSWITCH_CLIENT_ID || "";
  const secret = process.env.INTERSWITCH_CLIENT_SECRET || "";
  return id && id !== "your_client_id" && secret && secret !== "your_client_secret";
}

async function getInterswitchToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.INTERSWITCH_CLIENT_ID}:${process.env.INTERSWITCH_CLIENT_SECRET}`
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
    const {
      amount,
      accountNumber,
      bankCode,
      accountName,
      beneficiaryName,
      narration,
      transactionRef,
    } = await req.json();

    if (!amount || !accountNumber || !bankCode || !transactionRef) {
      return NextResponse.json(
        { error: "amount, accountNumber, bankCode, and transactionRef are required" },
        { status: 400 }
      );
    }

    // --- DEV MODE: credentials not configured, simulate successful transfer ---
    if (!isConfigured()) {
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({
        reference: transactionRef,
        status: "Approved",
        responseDescription: "Transfer successful (mock)",
        source: "mock",
      });
    }

    // --- PRODUCTION: real Interswitch Single Transfer ---
    const token = await getInterswitchToken();

    const payload = {
      mac: "",
      beneficiary: {
        lastName: accountName || beneficiaryName || "",
        otherNames: "",
        email: "",
        phone: "",
        accountNumber,
        bankCode,
      },
      initiation: {
        amount: Math.round(amount * 100), // kobo
        currencyCode: "566", // NGN
        paymentMethodCode: "AC",
        channel: "7",
        terminalID: process.env.INTERSWITCH_TERMINAL_ID || "",
      },
      transaction: {
        memo: narration || "PayFlex Fund Release",
        reference: transactionRef,
      },
      sender: {
        email: "payflex@payflex.ng",
        lastname: "PayFlex",
        othernames: "Platform",
        phone: "",
        country: "NG",
      },
    };

    const res = await fetch(
      `${ISW_BASE_URL}/api/v2/quickteller/payments/transfers/single`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          TerminalID: process.env.INTERSWITCH_TERMINAL_ID || "",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Transfer failed. Please try again." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      reference: data.transactionReference || transactionRef,
      status: data.responseDescription || "pending",
      source: "interswitch",
      raw: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
