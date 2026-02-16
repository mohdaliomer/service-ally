import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsError } = await supabaseUser.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { complaint_id, department, store, category, priority, description, reported_by_name } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get store manager emails for the store
    const { data: smRoles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'store_manager');
    const smIds = smRoles?.map(r => r.user_id) || [];

    let recipientEmails: string[] = [];
    if (smIds.length > 0) {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('email, store').in('id', smIds);
      recipientEmails = (profiles || [])
        .filter(p => p.store === store || p.store === 'ALL')
        .map(p => p.email);
    }

    // Also notify admins
    const { data: adminRoles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin');
    const adminIds = adminRoles?.map(r => r.user_id) || [];
    if (adminIds.length > 0) {
      const { data: adminProfiles } = await supabaseAdmin.from('profiles').select('email').in('id', adminIds);
      recipientEmails.push(...(adminProfiles?.map(p => p.email) || []));
    }

    const allRecipients = [...new Set(recipientEmails)];

    // Insert in-app notifications for store managers and admins
    const allUserIds = [...new Set([...smIds, ...adminIds])];
    if (allUserIds.length > 0) {
      // Filter to same store or ALL for store managers
      let notifUserIds: string[] = [];
      if (smIds.length > 0) {
        const { data: smProfiles } = await supabaseAdmin.from('profiles').select('id, store').in('id', smIds);
        notifUserIds.push(...(smProfiles || []).filter(p => p.store === store || p.store === 'ALL').map(p => p.id));
      }
      notifUserIds.push(...adminIds);
      const uniqueNotifIds = [...new Set(notifUserIds)];
      if (uniqueNotifIds.length > 0) {
        const rows = uniqueNotifIds.map(uid => ({
          user_id: uid,
          complaint_id,
          title: `New Request ${complaint_id}`,
          message: `New ${priority} priority request: ${category} at ${store}. Reported by ${reported_by_name}.`,
        }));
        await supabaseAdmin.from('notifications').insert(rows);
      }
    }

    if (allRecipients.length === 0) {
      return new Response(JSON.stringify({ success: true, recipients: [], message: 'No recipients found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">🆕 New Maintenance Request</h2>
          <p style="margin: 5px 0 0; opacity: 0.9;">Request ID: ${complaint_id}</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>A new maintenance request has been submitted and requires your attention.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Store:</td><td style="padding: 8px 0; font-weight: 600;">${store}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Department:</td><td style="padding: 8px 0;">${department || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Category:</td><td style="padding: 8px 0;">${category}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Priority:</td><td style="padding: 8px 0; font-weight: 600;">${priority}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Reported By:</td><td style="padding: 8px 0;">${reported_by_name}</td></tr>
          </table>
          ${description ? `<div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 6px;"><p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">Description:</p><p style="margin: 0;">${description}</p></div>` : ''}
          <p style="margin-top: 20px; font-size: 13px; color: #9ca3af;">Please log in to approve or take action on this request.</p>
        </div>
      </div>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Maintenance System <onboarding@resend.dev>',
        to: allRecipients,
        subject: `🆕 New Request ${complaint_id} — ${category} (${priority})`,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();
    console.log(`📧 New complaint email sent for ${complaint_id}`, resendData);

    return new Response(JSON.stringify({
      success: resendRes.ok,
      recipients: allRecipients,
      message: `Email sent to ${allRecipients.length} recipients`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
