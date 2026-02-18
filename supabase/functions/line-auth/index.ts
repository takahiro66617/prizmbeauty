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

    // Debug: try selecting a nonexistent column to get error hints about actual columns
    const { data: colTest, error: colError } = await extSupabase
      .from("influencers")
      .select("__nonexistent__")
      .limit(1);
    console.log("DEBUG column discovery error:", JSON.stringify(colError));

    // Also try selecting known possible columns individually
    const colTests = ["id","name","username","email","line_uid","external_id","sns_id","instagram_id","tiktok_id","bio","image_url","category","status","created_at","updated_at","instagram_followers","tiktok_followers","youtube_followers","twitter_followers","phone","nickname","gender","birth_date","prefecture","line_user_id","user_id"];
    const existingCols: string[] = [];
    const missingCols: string[] = [];
    for (const col of colTests) {
      const { error: e } = await extSupabase.from("influencers").select(col).limit(0);
      if (!e) existingCols.push(col);
      else missingCols.push(col);
    }
    console.log("DEBUG existing columns:", JSON.stringify(existingCols));
    console.log("DEBUG missing columns:", JSON.stringify(missingCols));

    // For now, since we don't know the right column, treat all as new users
    // (the table is empty anyway)
    const existingUser = null;

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
