import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { profileId, updates } = await req.json();
    if (!profileId || !updates) {
      return new Response(JSON.stringify({ error: "Missing profileId or updates" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Whitelist allowed fields
    const allowed = ["name", "username", "bio", "category", "instagram_followers", "tiktok_followers", "youtube_followers", "twitter_followers", "instagram_url", "tiktok_url", "youtube_url", "twitter_url", "email", "phone", "birth_date", "gender", "prefecture"];
    const sanitized: Record<string, any> = {};
    for (const key of allowed) {
      if (key in updates) sanitized[key] = updates[key];
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabaseAdmin
      .from("influencer_profiles")
      .update(sanitized)
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
