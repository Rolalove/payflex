Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { record } = payload; // Supabase Webhook payload

    if (!record || !record.email || !record.invite_token) {
      return new Response(JSON.stringify({ message: "No email or token to send" }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const { email, name, invite_token } = record;
    const protocol = Deno.env.get('ENV') === 'local' ? 'http' : 'https';
    const domain = Deno.env.get('PUBLIC_DOMAIN') || 'payflex.vercel.app';
    const inviteLink = `${protocol}://${domain}/pay/${invite_token}`;

    console.log(`[INVite SENT] to: ${email}, name: ${name}`);
    console.log(`[LINK]: ${inviteLink}`);

    // In a real implementation, you would use Resend, SendGrid, etc.
    /*
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'PayFlex <invites@payflex.com>',
        to: [email],
        subject: `You've been invited to a ${record.role_type === 'provider' ? 'Escrow' : 'Split Bill'} on PayFlex`,
        html: `<p>Hi ${name},</p><p>You have a new payment request. Click the link below to view details and confirm:</p><a href="${inviteLink}">${inviteLink}</a>`,
      }),
    });
    */

    return new Response(JSON.stringify({ success: true, message: "Invitation logged" }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (err: any) {
    console.error("Invite Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" } 
    });
  }
});
