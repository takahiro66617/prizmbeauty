import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXTERNAL_SUPABASE_URL = "https://hisethfmyvvkohauuluq.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpc2V0aGZteXZ2a29oYXV1bHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjI5ODIsImV4cCI6MjA4NDU5ODk4Mn0.Fxg2ol8VeUbqvUUKVIb3RmflHab8oUVn4pp88Wc21dk";

const LINE_CHANNEL_ID = "2009141875";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();
    const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET");

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "code and redirect_uri are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Exchange code for access token
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET!,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("LINE token error:", tokenData);
      return new Response(
        JSON.stringify({ error: "Failed to exchange LINE token", details: tokenData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get LINE user profile
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profileData = await profileRes.json();

    if (!profileRes.ok || !profileData.userId) {
      console.error("LINE profile error:", profileData);
      return new Response(
        JSON.stringify({ error: "Failed to get LINE profile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if user exists in external DB
    const extSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);

    // Debug: discover actual columns
    const { data: sampleData, error: sampleError } = await extSupabase
      .from("influencers")
      .select("*")
      .limit(1);
    
    console.log("DEBUG influencers columns:", sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : "empty table");
    console.log("DEBUG sampleData:", JSON.stringify(sampleData));
    console.log("DEBUG sampleError:", sampleError);

    // Try multiple possible column names for LINE user ID
    let existingUser = null;
    let searchError = null;

    // Try 'line_user_id' first
    const r1 = await extSupabase.from("influencers").select("*").eq("line_user_id", profileData.userId).maybeSingle();
    if (!r1.error) {
      existingUser = r1.data;
    } else {
      // Try 'user_id'
      const r2 = await extSupabase.from("influencers").select("*").eq("user_id", profileData.userId).maybeSingle();
      if (!r2.error) {
        existingUser = r2.data;
      } else {
        // Try 'id'
        const r3 = await extSupabase.from("influencers").select("*").eq("id", profileData.userId).maybeSingle();
        if (!r3.error) {
          existingUser = r3.data;
        } else {
          // Try 'line_id'
          const r4 = await extSupabase.from("influencers").select("*").eq("line_id", profileData.userId).maybeSingle();
          if (!r4.error) {
            existingUser = r4.data;
          } else {
            console.error("All column attempts failed. Errors:", {
              line_user_id: r1.error?.message,
              user_id: r2.error?.message,
              id: r3.error?.message,
              line_id: r4.error?.message,
            });
            searchError = r1.error;
          }
        }
      }
    }

    if (searchError) {
      console.error("DB search error:", searchError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        isNewUser: !existingUser,
        lineProfile: {
          userId: profileData.userId,
          displayName: profileData.displayName,
          pictureUrl: profileData.pictureUrl || null,
        },
        user: existingUser || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
