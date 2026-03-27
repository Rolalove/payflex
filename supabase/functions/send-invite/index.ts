Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    // Support both Supabase Webhook (record) and Direct Call (data)
    const record = payload.record || payload;

    console.log("[INVITE] Payload received:", JSON.stringify(record));

    if (!record || !record.email || !record.invite_token) {
      console.warn("[INVITE] Missing required fields:", { email: !!record?.email, token: !!record?.invite_token });
      return new Response(JSON.stringify({ message: "No email or token to send" }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const { email, name, invite_token, role_type } = record;
    const protocol = Deno.env.get('ENV') === 'local' ? 'http' : 'https';
    const domain = Deno.env.get('PUBLIC_DOMAIN') || 'payflex.vercel.app';
    const invitePath = isEscrow ? `/signup?token=${invite_token}` : `/pay/${invite_token}`;
    const inviteLink = `${protocol}://${domain}${invitePath}`;
    
    const subject = isEscrow 
      ? `Invitation: Secure Your Escrow Transaction on PayFlex`
      : `Invite: You've been invited to a ${typeLabel} on PayFlex`;
    
    const bodyText = isEscrow
      ? `You've been invited to participate in a secure <strong>Escrow Transaction</strong> on PayFlex. Since escrow involves protected fund holding, platform registration is required to manage the transaction and confirm completion.`
      : `You've been invited to participate in a <strong>${typeLabel}</strong> on PayFlex. You can view the details and complete your portion of the payment securely through our platform.`;
    
    const ctaText = isEscrow ? 'Sign Up to Participate' : 'View Details & Pay';

    console.log(`[INVITE] Preparing to send to ${email} for ${typeLabel}. Link: ${inviteLink}`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'PayFlex <invites@payflex.com>',
        to: [email],
        subject: subject,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #f0f0f0; border-radius: 24px; color: #1a1a1a; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 40px; height: 40px; background-color: #10367D; border-radius: 10px; margin-bottom: 10px;"></div>
              <h2 style="color: #10367D; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">PayFlex</h2>
            </div>
            
            <h2 style="color: #1a1a1a; margin-bottom: 15px; font-size: 20px; font-weight: 700;">You have a new payment request</h2>
            <p style="font-size: 16px; margin-bottom: 10px;">Hi ${name || 'there'},</p>
            <p style="font-size: 16px; margin-bottom: 30px; color: #444;">${bodyText}</p>
            
            <div style="margin: 40px 0; text-align: center;">
              <a href="${inviteLink}" style="background-color: #10367D; color: white; padding: 18px 36px; border-radius: 100px; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 10px 20px rgba(16, 54, 125, 0.15);">
                ${ctaText}
              </a>
            </div>
          </div>
        `,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error('[RESEND ERROR]', resData);
      throw new Error(`Resend API error: ${resData.message || res.statusText}`);
    }

    console.log("[INVITE SUCCESS]", resData);

    return new Response(JSON.stringify({ success: true, id: resData.id }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (err: any) {
    console.error("[INVITE CRITICAL ERROR]", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" } 
    });
  }
});
