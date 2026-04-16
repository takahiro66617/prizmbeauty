import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LineMessageRequest {
  line_user_id: string;
  message: string;
  influencer_id?: string;
  message_type?: string;
  sent_by?: string;
}

async function getLineAccessToken(supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "line_messaging_config")
    .single();
  if (data?.value && typeof data.value === "object") {
    return (data.value as any).channel_access_token || null;
  }
  return null;
}

async function sendLinePushMessage(accessToken: string, lineUserId: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text: message }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("LINE Push API error:", res.status, errBody);
    return { ok: false, error: `LINE API ${res.status}: ${errBody}` };
  }
  await res.text();
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: LineMessageRequest = await req.json();
    const { line_user_id, message, influencer_id, message_type, sent_by } = body;

    if (!line_user_id || !message) {
      return new Response(JSON.stringify({ error: "line_user_id and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get access token from app_settings
    const accessToken = await getLineAccessToken(supabase);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "LINE Channel Access Token is not configured. Please set it in LINE設定." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send LINE push message
    const result = await sendLinePushMessage(accessToken, line_user_id, message);

    // Log the message
    await supabase.from("line_message_logs").insert({
      influencer_id: influencer_id || null,
      line_user_id,
      message_type: message_type || "manual",
      message_content: message,
      status: result.ok ? "sent" : "failed",
      error_detail: result.error || null,
      sent_by: sent_by || "system",
    });

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-line-message error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
