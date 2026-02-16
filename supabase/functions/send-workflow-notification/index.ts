import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map status to the role that needs to act next
const STATUS_TO_ROLE: Record<string, string> = {
  'Submitted': 'store_coordinator',
  'Pending-Stage-2': 'store_manager',
  'Pending-Stage-3': 'maintenance_coordinator',
  'Internal-Pending-MM': 'maintenance_manager',
  'Internal-Pending-SM': 'store_manager',
  'External-Pending-RM': 'regional_manager',
  'External-Pending-MC-QC': 'maintenance_coordinator',
  'External-Pending-MM': 'maintenance_manager',
  'External-Pending-Admin': 'admin_manager',
  'External-Pending-MC-2': 'maintenance_coordinator',
  'External-Pending-MM-2': 'maintenance_manager',
  'External-Pending-SM': 'store_manager',
};

const STATUS_LABELS: Record<string, string> = {
  'Submitted': 'Request Created — Awaiting Store Coordinator',
  'Pending-Stage-2': 'Pending Store Manager Approval',
  'Pending-Stage-3': 'Pending Coordinator Decision (Internal/External)',
  'Internal-Pending-MM': 'Internal — Pending Maintenance Manager Approval',
  'Internal-Pending-SM': 'Internal — Pending Store Manager Verification',
  'External-Pending-RM': 'External — Pending Regional Manager Approval',
  'External-Pending-MC-QC': 'External — Pending Quality Check',
  'External-Pending-MM': 'External — Pending Maintenance Manager Approval',
  'External-Pending-Admin': 'External — Pending Admin Manager Approval',
  'External-Pending-MC-2': 'External — Pending Coordinator Acknowledgment',
  'External-Pending-MM-2': 'External — Pending Maintenance Manager Final Review',
  'External-Pending-SM': 'External — Pending Store Manager Verification',
  'Completed-Internal': 'Completed (Internal)',
  'Completed-External': 'Completed (External)',
  'Rejected': 'Rejected',
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

    const {
      complaint_id,
      store,
      category,
      description,
      priority,
      new_status,
      action_taken,
      action_by,
      notes,
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine who needs to be notified
    let recipientEmails: string[] = [];
    const nextRole = STATUS_TO_ROLE[new_status];

    if (nextRole) {
      // Find users with the target role
      const { data: roleUsers } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', nextRole);

      const userIds = roleUsers?.map(r => r.user_id) || [];

      if (userIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('email, store')
          .in('id', userIds);

        // Filter to users in the same store or with 'ALL' access
        recipientEmails = (profiles || [])
          .filter(p => p.store === store || p.store === 'ALL')
          .map(p => p.email);
      }
    }

    // For completed/rejected, also notify the original reporter
    if (new_status === 'Completed-Internal' || new_status === 'Completed-External' || new_status === 'Rejected') {
      const { data: complaint } = await supabaseAdmin
        .from('complaints')
        .select('reported_by')
        .eq('id', complaint_id)
        .single();

      if (complaint?.reported_by) {
        const { data: reporterProfile } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', complaint.reported_by)
          .single();
        if (reporterProfile?.email) {
          recipientEmails.push(reporterProfile.email);
        }
      }
    }

    // For send_back, notify store coordinators + original reporter
    if (action_taken === 'send_back') {
      const { data: coordRoles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'store_coordinator');

      const coordIds = coordRoles?.map(r => r.user_id) || [];
      if (coordIds.length > 0) {
        const { data: coordProfiles } = await supabaseAdmin
          .from('profiles')
          .select('email, store')
          .in('id', coordIds);

        const coordEmails = (coordProfiles || [])
          .filter(p => p.store === store || p.store === 'ALL')
          .map(p => p.email);
        recipientEmails.push(...coordEmails);
      }

      const { data: complaint } = await supabaseAdmin
        .from('complaints')
        .select('reported_by')
        .eq('id', complaint_id)
        .single();

      if (complaint?.reported_by) {
        const { data: rp } = await supabaseAdmin.from('profiles').select('email').eq('id', complaint.reported_by).single();
        if (rp?.email) recipientEmails.push(rp.email);
      }
    }

    const allRecipients = [...new Set(recipientEmails)];

    // Also collect user IDs for in-app notifications
    let recipientUserIds: string[] = [];
    if (nextRole) {
      const { data: roleUsers } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', nextRole);
      const userIds = roleUsers?.map(r => r.user_id) || [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabaseAdmin.from('profiles').select('id, store').in('id', userIds);
        recipientUserIds = (profiles || []).filter(p => p.store === store || p.store === 'ALL').map(p => p.id);
      }
    }
    if (new_status === 'Completed-Internal' || new_status === 'Completed-External' || new_status === 'Rejected') {
      const { data: complaint } = await supabaseAdmin.from('complaints').select('reported_by').eq('id', complaint_id).single();
      if (complaint?.reported_by) recipientUserIds.push(complaint.reported_by);
    }
    if (action_taken === 'send_back') {
      const { data: coordRoles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'store_coordinator');
      const coordIds = coordRoles?.map(r => r.user_id) || [];
      if (coordIds.length > 0) {
        const { data: coordProfiles } = await supabaseAdmin.from('profiles').select('id, store').in('id', coordIds);
        recipientUserIds.push(...(coordProfiles || []).filter(p => p.store === store || p.store === 'ALL').map(p => p.id));
      }
      const { data: complaint } = await supabaseAdmin.from('complaints').select('reported_by').eq('id', complaint_id).single();
      if (complaint?.reported_by) recipientUserIds.push(complaint.reported_by);
    }

    const uniqueUserIds = [...new Set(recipientUserIds)];

    // Insert in-app notifications
    if (uniqueUserIds.length > 0) {
      const notifTitle = isSendBack
        ? `Request ${complaint_id} — Sent Back`
        : isRejected
        ? `Request ${complaint_id} — Rejected`
        : isCompleted
        ? `Request ${complaint_id} — Completed`
        : `Request ${complaint_id} — Action Required`;
      const notifMessage = `${statusLabel}. Action: ${actionLabel} by ${action_by}${notes ? '. Notes: ' + notes : ''}`;

      const rows = uniqueUserIds.map(uid => ({
        user_id: uid,
        complaint_id,
        title: notifTitle,
        message: notifMessage,
      }));
      await supabaseAdmin.from('notifications').insert(rows);
    }

    if (allRecipients.length === 0) {
      console.log(`No email recipients found for ${complaint_id} status ${new_status}`);
      return new Response(JSON.stringify({ success: true, recipients: [], message: 'No email recipients found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const statusLabel = STATUS_LABELS[new_status] || new_status;
    const actionLabel = (action_taken || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

    const isSendBack = action_taken === 'send_back';
    const isRejected = new_status === 'Rejected';
    const isCompleted = new_status === 'Completed-Internal' || new_status === 'Completed-External';

    const subject = isSendBack
      ? `⚠️ Request ${complaint_id} — Sent Back for Clarification`
      : isRejected
      ? `❌ Request ${complaint_id} — Rejected`
      : isCompleted
      ? `✅ Request ${complaint_id} — Completed`
      : `📋 Request ${complaint_id} — Action Required: ${statusLabel}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${isRejected ? '#dc2626' : isCompleted ? '#16a34a' : isSendBack ? '#d97706' : '#2563eb'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">${isSendBack ? '⚠️ Sent Back for Clarification' : isRejected ? '❌ Request Rejected' : isCompleted ? '✅ Request Completed' : '📋 Action Required'}</h2>
          <p style="margin: 5px 0 0; opacity: 0.9;">Request ID: ${complaint_id}</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Store:</td><td style="padding: 8px 0; font-weight: 600;">${store}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Category:</td><td style="padding: 8px 0;">${category}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Priority:</td><td style="padding: 8px 0;">${priority || 'Medium'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Current Status:</td><td style="padding: 8px 0; font-weight: 600;">${statusLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Action Taken:</td><td style="padding: 8px 0;">${actionLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">By:</td><td style="padding: 8px 0;">${action_by}</td></tr>
          </table>
          ${description ? `<div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 6px;"><p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">Description:</p><p style="margin: 0;">${description}</p></div>` : ''}
          ${notes ? `<div style="margin-top: 12px; padding: 12px; background: ${isSendBack ? '#fef3c7' : '#f0f9ff'}; border-radius: 6px; border-left: 3px solid ${isSendBack ? '#d97706' : '#2563eb'};"><p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">${isSendBack ? 'Reason for Send Back:' : 'Notes:'}</p><p style="margin: 0;">${notes}</p></div>` : ''}
          <p style="margin-top: 20px; font-size: 13px; color: #9ca3af;">This is an automated notification from the Maintenance Request System. Please log in to take action.</p>
        </div>
      </div>
    `;

    // Send email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Maintenance System <onboarding@resend.dev>',
        to: allRecipients,
        subject,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();
    console.log(`📧 Email sent for ${complaint_id} → ${allRecipients.join(', ')}`, resendData);

    return new Response(JSON.stringify({
      success: resendRes.ok,
      recipients: allRecipients,
      message: `Email sent to ${allRecipients.length} recipients`,
      resend_id: resendData.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Notification error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
