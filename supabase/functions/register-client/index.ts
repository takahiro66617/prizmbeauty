import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, company_name, display_name, contact_name, industry, phone, website, description } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create auth user with client role
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "client",
        display_name: display_name || company_name || "",
        company_name: company_name || "",
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update company record with additional fields (created by trigger)
    if (user.user.id && (contact_name || industry || phone || website || description)) {
      // Small delay to ensure trigger has created the company record
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updates: Record<string, any> = {};
      if (contact_name) updates.contact_name = contact_name;
      if (industry) updates.industry = industry;
      if (phone) updates.phone = phone;
      if (website) updates.website = website;
      if (description) updates.description = description;

      // Retry up to 3 times
      for (let i = 0; i < 3; i++) {
        const { error: updateError } = await supabaseAdmin
          .from("companies")
          .update(updates)
          .eq("user_id", user.user.id);
        if (!updateError) break;
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: user.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
