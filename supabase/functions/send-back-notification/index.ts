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

    const { complaint_id, store, category, description, sent_back_by, notes } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find the Store Coordinator(s) for this store
    const { data: coordinatorRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'store_coordinator');

    const coordinatorIds = coordinatorRoles?.map(r => r.user_id) || [];

    let recipientEmails: string[] = [];
    if (coordinatorIds.length > 0) {
      // Get profiles that match the store
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('email, store')
        .in('id', coordinatorIds);

      // Filter to coordinators in the same store or with 'ALL' access
      recipientEmails = (profiles || [])
        .filter(p => p.store === store || p.store === 'ALL')
        .map(p => p.email);
    }

    // Also get the original complaint reporter
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

    const allRecipients = [...new Set(recipientEmails)];

    // Log the notification (in production, integrate with email service like Resend/SendGrid)
    console.log(`📧 Send-Back Notification for ${complaint_id}`);
    console.log(`Recipients: ${allRecipients.join(', ')}`);
    console.log(`Subject: Request ${complaint_id} Sent Back for Clarification`);
    console.log(`Body:
      Request ${complaint_id} has been sent back to the Store Coordinator for clarification.

      Store: ${store}
      Category: ${category}
      Description: ${description}

      Sent back by: ${sent_back_by}
      Reason / Notes: ${notes}

      Please review and re-submit the request with the requested clarifications.
    `);

    return new Response(JSON.stringify({
      success: true,
      recipients: allRecipients,
      message: `Send-back notification sent to ${allRecipients.length} recipients`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
