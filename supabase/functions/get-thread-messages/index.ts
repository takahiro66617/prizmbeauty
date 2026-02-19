import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { applicationId } = await req.json();
    if (!applicationId) {
      return new Response(JSON.stringify({ error: "Missing applicationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get application with full details
    const { data: app, error: appError } = await supabaseAdmin
      .from("applications")
      .select("*, campaigns(id, title, image_url, budget_min, budget_max, deadline, category, platform, description, deliverables, requirements, companies(id, name, logo_url)), influencer_profiles(id, name, username, image_url, user_id)")
      .eq("id", applicationId)
      .single();

    if (appError) throw appError;

    // Get messages for this thread
    const { data: messages, error: msgError } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });

    if (msgError) throw msgError;

    return new Response(JSON.stringify({ application: app, messages: messages || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
