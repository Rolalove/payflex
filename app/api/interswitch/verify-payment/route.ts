import { NextRequest, NextResponse } from "next/server";

const ISW_QA_URL = "https://qa.interswitchng.com";

// We keep the token function but make it optional for the verification call
// as the documentation for collections/api/v1 doesn't show an Authorization header.
async function getInterswitchToken(): Promise<string | null> {
  try {
    const credentials = Buffer.from(
      `${process.env.INTERSWITCH_CLIENT_ID}:${process.env.INTERSWITCH_CLIENT_SECRET}`
    ).toString("base64");

    const res = await fetch(`${ISW_QA_URL}/passport/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=profile",
      signal: AbortSignal.timeout(5000), // 5s timeout for token
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token;
  } catch (e) {
    console.error("Token fetch failed (optional):", e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txnRef = searchParams.get("txnRef");
  const amount = searchParams.get("amount"); // Amount in Kobo
  const merchantCode = process.env.NEXT_PUBLIC_INTERSWITCH_MERCHANT_CODE;

  console.log(`[VERIFY] Incoming request: txnRef=${txnRef}, amount=${amount}, merchantCode=${merchantCode}`);

  if (!txnRef || !amount || !merchantCode) {
    return NextResponse.json(
      { error: "txnRef, amount, and merchantCode are required" },
      { status: 400 }
    );
  }

  try {
    // Official Verification URL from documentation:
    const url = `${ISW_QA_URL}/collections/api/v1/gettransaction.json?merchantcode=${merchantCode}&transactionreference=${txnRef}&amount=${amount}`;

    console.log(`[VERIFY] Fetching from Interswitch: ${url}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Try to add token if we have one, but don't let it block us
    const token = await getInterswitchToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000), // 15s timeout for the query
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[VERIFY] Interswitch query error:", res.status, err);
      return NextResponse.json(
        { error: `Interswitch error (${res.status}): ${err.slice(0, 100)}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("[VERIFY] Interswitch response data:", JSON.stringify(data));

    const code = data.ResponseCode || data.responseCode || '';

    // "00" = approved
    if (code === '00') {
      return NextResponse.json({ success: true, pending: false, data });
    }

    // "Z0" = request in progress, "10" = transaction still processing
    // These are transitional — the client should retry
    if (code === 'Z0' || code === '10') {
      return NextResponse.json({ success: false, pending: true, data });
    }

    // All other codes = definitive failure
    return NextResponse.json({ 
      success: false, 
      pending: false,
      error: `Payment failed: ${data.ResponseDescription || data.responseDescription || code}`,
      data 
    });

  } catch (err: any) {
    console.error("[VERIFY] Exception during verification:", err);
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    return NextResponse.json({ 
      error: isTimeout ? "Interswitch verification timed out. Please try again." : err.message,
      isTimeout
    }, { status: 500 });
  }
}
