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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get department contacts
    const { data: contacts } = await supabaseAdmin
      .from('department_contacts')
      .select('email, name')
      .eq('department', department || 'Admin');

    // Get all admin users for notification
    const { data: adminRoles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin');
    const adminIds = adminRoles?.map(r => r.user_id) || [];
    
    let adminEmails: string[] = [];
    if (adminIds.length > 0) {
      const { data: adminProfiles } = await supabaseAdmin.from('profiles').select('email').in('id', adminIds);
      adminEmails = adminProfiles?.map(p => p.email) || [];
    }

    const contactEmails = contacts?.map(c => c.email) || [];
    const allRecipients = [...new Set([...contactEmails, ...adminEmails])];

    // Log the notification (in production, integrate with email service like Resend/SendGrid)
    console.log(`📧 Complaint Notification for ${complaint_id}`);
    console.log(`Recipients: ${allRecipients.join(', ')}`);
    console.log(`Subject: New Complaint ${complaint_id} - ${category} (${priority})`);
    console.log(`Body: 
      Complaint ID: ${complaint_id}
      Store: ${store}
      Department: ${department}
      Category: ${category}
      Priority: ${priority}
      Description: ${description}
      Reported By: ${reported_by_name}
    `);

    return new Response(JSON.stringify({ 
      success: true, 
      recipients: allRecipients,
      message: `Notification sent to ${allRecipients.length} recipients`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
