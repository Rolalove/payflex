/**
 * InterswitchCheckout.ts
 *
 * Reusable Interswitch Web Checkout (Inline) utility.
 *
 * The script is already loaded globally in app/layout.tsx via next/script,
 * so this module focuses purely on calling window.webpayCheckout and
 * handling the server-side requery lifecycle.
 *
 * Test merchant code: MX007
 */

export interface PaymentOptions {
  /** Amount in Naira (will be converted to Kobo internally). */
  amountNaira: number;
  /** Display name for the payment item, shown in the Interswitch modal. */
  payItemName: string;
  /** Unique transaction reference you generate on the client. */
  txnRef: string;
  /**
   * The transaction_participants row ID to update on successful payment.
   * When provided, the server (using the service role key) performs the
   * Supabase UPDATE — the client never touches the database directly.
   */
  participantId?: string;
  /** Customer email (shown in Interswitch receipt). */
  custEmail?: string;
  /** Override merchant code (defaults to NEXT_PUBLIC_INTERSWITCH_MERCHANT_CODE or MX007 in test). */
  merchantCode?: string;
  /** Override pay-item ID (defaults to NEXT_PUBLIC_INTERSWITCH_PAY_ITEM_ID). */
  payItemId?: string;
  /** URL Interswitch redirects to after payment (defaults to current origin). */
  siteRedirectUrl?: string;
  /**
   * Called after the server has confirmed payment AND updated the database.
   * No DB work needed here — just UI updates.
   */
  onSuccess: () => void | Promise<void>;
  /**
   * Called when verification is pending after all retries.
   */
  onPending?: () => void;
  /**
   * Called when verification definitively fails.
   */
  onFailure?: (error: string) => void;
}

/** Maximum server requery attempts before giving up. */
const MAX_ATTEMPTS = 10;
/** Delay between retry attempts in milliseconds. */
const RETRY_DELAY_MS = 3_000;

/**
 * Calls the /api/payments/verify route with retry logic.
 * Returns {success, pending, error?}.
 */
async function verifyPaymentOnServer(
  txnRef: string,
  amountKobo: number,
  participantId?: string
): Promise<{ success: boolean; pending: boolean; error?: string }> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(
      `[ISW-CHECKOUT] Requery attempt ${attempt}/${MAX_ATTEMPTS} — txnRef: ${txnRef}`
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);

      // Build URL — include participantId so the server can UPDATE the DB itself
      const params = new URLSearchParams({
        txnRef,
        amount: String(amountKobo),
        ...(participantId ? { participantId } : {}),
      });

      const res = await fetch(`/api/payments/verify?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      console.log(`[ISW-CHECKOUT] Attempt ${attempt} response:`, data);

      if (data.success) return { success: true, pending: false };

      if (data.pending) {
        if (attempt < MAX_ATTEMPTS) {
          await delay(RETRY_DELAY_MS);
          continue;
        }
        return {
          success: false,
          pending: true,
          error:
            "Bank is taking longer than expected. Please check your transaction history.",
        };
      }

      return {
        success: false,
        pending: false,
        error: data.error ?? "Payment verification failed.",
      };
    } catch (err: unknown) {
      const isAbort =
        err instanceof Error &&
        (err.name === "AbortError" || err.name === "TimeoutError");

      if (attempt === MAX_ATTEMPTS) {
        return {
          success: false,
          pending: false,
          error: isAbort
            ? "Verification timed out. Please try again."
            : "Could not reach verification server.",
        };
      }
      await delay(RETRY_DELAY_MS);
    }
  }

  return {
    success: false,
    pending: false,
    error: "Verification exhausted all attempts.",
  };
}

/** Simple promise-based sleep. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * handlePayment — open the Interswitch inline checkout modal.
 *
 * Pre-conditions:
 *  - The Interswitch script must already be on the page
 *    (guaranteed by app/layout.tsx on every route).
 *  - window.webpayCheckout must be defined.
 *
 * @example
 * ```ts
 * await handlePayment({
 *   amountNaira: 5_000,
 *   payItemName: "Split Bill: Dinner",
 *   txnRef: `FP-${Date.now()}`,
 *   custEmail: "jane@example.com",
 *   onSuccess: async (resp) => {
 *     // Update DB, navigate, etc.
 *   },
 *   onPending: () => alert("Bank is still processing, check back later."),
 *   onFailure: (err) => alert(err),
 * });
 * ```
 */
export async function handlePayment(options: PaymentOptions): Promise<void> {
  const {
    amountNaira,
    payItemName,
    txnRef,
    participantId,
    custEmail = "customer@payflex.com",
    merchantCode,
    payItemId,
    siteRedirectUrl,
    onSuccess,
    onPending,
    onFailure,
  } = options;

  if (typeof window === "undefined") {
    console.warn("[ISW-CHECKOUT] handlePayment called in a non-browser context.");
    return;
  }

  if (typeof (window as Window & { webpayCheckout?: unknown }).webpayCheckout !== "function") {
    const msg =
      "Interswitch checkout is still loading. Please try again in a moment.";
    onFailure?.(msg);
    return;
  }

  // Fallback chain: explicit override → env var → MX007 (Interswitch test code)
  const resolvedMerchantCode =
    merchantCode ??
    process.env.NEXT_PUBLIC_INTERSWITCH_MERCHANT_CODE ??
    "MX007";

  const resolvedPayItemId =
    payItemId ?? process.env.NEXT_PUBLIC_INTERSWITCH_PAY_ITEM_ID ?? "";

  const amountInKobo = Math.round(amountNaira * 100);

  const request = {
    merchant_code: resolvedMerchantCode,
    pay_item_id: resolvedPayItemId,
    pay_item_name: payItemName,
    txn_ref: txnRef,
    amount: amountInKobo,
    currency: 566, // NGN
    cust_email: custEmail,
    site_redirect_url: siteRedirectUrl ?? window.location.origin,
    mode: "TEST",

    onComplete: async (response: Record<string, unknown>) => {
      // Interswitch docs: ALWAYS server-side requery — never trust callback alone.
      // The server also performs the Supabase UPDATE so the client never touches the DB.
      console.log(
        "[ISW-CHECKOUT] Widget callback received. Running server requery…",
        response
      );

      const result = await verifyPaymentOnServer(txnRef, amountInKobo, participantId);

      if (result.success) {
        await onSuccess();
      } else if (result.pending) {
        onPending?.();
      } else {
        onFailure?.(result.error ?? "Payment failed.");
      }
    },
  };

  try {
    (window as Window & { webpayCheckout: (r: unknown) => void }).webpayCheckout(request);
  } catch (err) {
    console.error("[ISW-CHECKOUT] Error calling webpayCheckout:", err);
    onFailure?.("Could not open payment window. Please try again.");
  }
}
