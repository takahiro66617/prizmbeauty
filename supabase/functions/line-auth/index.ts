import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LINE_CHANNEL_ID = "2009141875";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();
    const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET");

    if (!LINE_CHANNEL_SECRET) {
      console.error("LINE_CHANNEL_SECRET is not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error: LINE_CHANNEL_SECRET missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        client_secret: LINE_CHANNEL_SECRET,
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

    // 3. Check friendship status
    // IMPORTANT: fail-open when LINE friendship API is unavailable (e.g. 40007)
    // so registration never gets blocked by channel-side configuration issues.
    let friendFlag = true;
    let friendshipChecked = false;
    let friendshipError: string | null = null;

    try {
      const friendshipRes = await fetch("https://api.line.me/friendship/v1/status", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (friendshipRes.ok) {
        const friendshipData = await friendshipRes.json();
        friendshipChecked = true;
        friendFlag = friendshipData.friendFlag === true;
      } else {
        friendshipError = `friendship_api_${friendshipRes.status}`;
        // Keep friendFlag=true to avoid blocking onboarding on external API/config issues.
        console.error("LINE friendship check failed:", await friendshipRes.text());
      }
    } catch (e) {
      friendshipError = "friendship_api_exception";
      // Keep friendFlag=true to avoid blocking onboarding on external API/config issues.
      console.error("Friendship API error:", e);
    }

    // 4. Check if user exists in DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    let existingUser = null;
    try {
      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("line_user_id", profileData.userId)
        .maybeSingle();

      if (!error && data) {
        existingUser = data;
      }
    } catch (e) {
      console.error("DB lookup error:", e);
    }

    return new Response(
      JSON.stringify({
        isNewUser: !existingUser,
        friendFlag,
        friendshipChecked,
        friendshipError,
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
