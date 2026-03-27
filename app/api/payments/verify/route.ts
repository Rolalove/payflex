/**
 * GET /api/payments/verify
 *
 * Server-side requery endpoint for Interswitch Web Checkout.
 *
 * Query params:
 *   txnRef         - The transaction reference sent to Interswitch during checkout.
 *   amount         - Amount in Kobo (must match what was sent to the widget).
 *   participantId  - (optional) transaction_participants row ID.
 *                   When provided AND payment is approved, the server updates
 *                   the row using the service role key so no DB write ever
 *                   happens from the client.
 *
 * Response shape:
 *   { success: true }                      — Approved + DB updated
 *   { success: false, pending: true }      — Bank still processing (client retries)
 *   { success: false, error: string }      — Definitive failure
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ISW_QA_BASE = "https://newwebpay.qa.interswitchng.com";
const ISW_PASSPORT_BASE = "https://qa.interswitchng.com";

/** Supabase admin client — uses service role key, bypasses RLS. Server-only. */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey === "your-service-role-key-here") {
    console.warn(
      "[PAYMENTS/VERIFY] SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "DB update will be skipped. Add it to .env.local from your Supabase dashboard."
    );
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      // Disable cookie-based session persistence — this is a server-only client
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/** Attempt to obtain an Interswitch OAuth bearer token. Non-fatal on failure. */
async function getAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.INTERSWITCH_CLIENT_ID;
    const clientSecret = process.env.INTERSWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) return null;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(`${ISW_PASSPORT_BASE}/passport/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=profile",
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return (data.access_token as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Update transaction_participants using the admin (service role) client.
 * Returns an error string on failure, null on success.
 */
async function markParticipantPaid(
  participantId: string,
  amountKobo: number
): Promise<string | null> {
  const admin = getAdminClient();

  if (!admin) {
    // Key not configured yet — skip DB update but don't fail the payment flow
    return null;
  }

  const amountNaira = amountKobo / 100;

  const { error } = await admin
    .from("transaction_participants")
    .update({
      amount_paid: amountNaira,
      paid_at: new Date().toISOString(),
    })
    .eq("id", participantId);

  if (error) {
    console.error("[PAYMENTS/VERIFY] Supabase update error:", error.message);
    return error.message;
  }

  console.log(
    `[PAYMENTS/VERIFY] Marked participant ${participantId} as paid (₦${amountNaira})`
  );
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txnRef = searchParams.get("txnRef");
  const amount = searchParams.get("amount"); // Kobo
  const participantId = searchParams.get("participantId") ?? undefined;
  const merchantCode =
    process.env.NEXT_PUBLIC_INTERSWITCH_MERCHANT_CODE ?? "MX007";

  console.log(
    `[PAYMENTS/VERIFY] Incoming: txnRef=${txnRef} amount=${amount} ` +
    `participantId=${participantId ?? "none"} merchantCode=${merchantCode}`
  );

  if (!txnRef || !amount) {
    return NextResponse.json(
      { error: "txnRef and amount are required query parameters." },
      { status: 400 }
    );
  }

  const amountInt = parseInt(amount, 10);
  if (isNaN(amountInt) || amountInt <= 0) {
    return NextResponse.json(
      { error: "amount must be a positive integer (value in Kobo)." },
      { status: 400 }
    );
  }

  const url =
    `${ISW_QA_BASE}/collections/api/v1/gettransaction.json` +
    `?merchantcode=${encodeURIComponent(merchantCode)}` +
    `&transactionreference=${encodeURIComponent(txnRef)}` +
    `&amount=${amountInt}`;

  console.log(`[PAYMENTS/VERIFY] Querying Interswitch: ${url}`);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[PAYMENTS/VERIFY] Interswitch HTTP ${res.status}:`, body.slice(0, 200));
      return NextResponse.json(
        { error: `Interswitch error (HTTP ${res.status}): ${body.slice(0, 100)}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const code: string = (data.ResponseCode ?? data.responseCode ?? "") as string;

    console.log(`[PAYMENTS/VERIFY] ResponseCode="${code}" for txnRef=${txnRef}`);

    // ── APPROVED ──────────────────────────────────────────────────────────────
    if (code === "00") {
      // Update the database server-side — client never writes to Supabase directly
      if (participantId) {
        const dbError = await markParticipantPaid(participantId, amountInt);
        if (dbError) {
          // Payment confirmed by Interswitch but DB write failed.
          // Return a specific flag so the client can show a human-friendly message
          // without rolling back the payment.
          return NextResponse.json({
            success: true,
            dbUpdateFailed: true,
            error: "Payment confirmed but record update failed. Please contact support.",
          });
        }
      }

      return NextResponse.json({ success: true, pending: false });
    }

    // ── PENDING ───────────────────────────────────────────────────────────────
    if (code === "Z0" || code === "10") {
      return NextResponse.json({ success: false, pending: true });
    }

    // ── FAILURE ───────────────────────────────────────────────────────────────
    const description: string =
      (data.ResponseDescription ?? data.responseDescription ?? code) as string;

    return NextResponse.json({
      success: false,
      pending: false,
      error: `Payment failed: ${description}`,
    });

  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "AbortError" || err.name === "TimeoutError");

    console.error("[PAYMENTS/VERIFY] Exception:", err);

    return NextResponse.json(
      {
        error: isTimeout
          ? "Interswitch verification timed out. Please try again."
          : err instanceof Error
          ? err.message
          : "An unexpected error occurred.",
        isTimeout,
      },
      { status: 500 }
    );
  }
}

