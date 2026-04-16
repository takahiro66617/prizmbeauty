import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getLineConfig(supabase: any) {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "line_messaging_config")
    .single();
  return data?.value && typeof data.value === "object" ? data.value : null;
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

    const body = await req.json();
    const { action } = body;

    // --- Connection test ---
    if (action === "test_connection") {
      const config = await getLineConfig(supabase);
      const token = config?.channel_access_token;
      if (!token) {
        return jsonOk({ connected: false, reason: "トークン未設定" });
      }
      // Call LINE Bot Info API to validate token
      const res = await fetch("https://api.line.me/v2/bot/info", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const info = await res.json();
        return jsonOk({ connected: true, botName: info.displayName, botId: info.userId, pictureUrl: info.pictureUrl });
      }
      const errText = await res.text();
      return jsonOk({ connected: false, reason: `API応答エラー (${res.status}): ${errText}` });
    }

    // --- Bulk send ---
    if (action === "bulk_send") {
      const { targets, message: msgText } = body;
      if (!targets || !Array.isArray(targets) || targets.length === 0 || !msgText) {
        return jsonError("targets and message are required");
      }

      const config = await getLineConfig(supabase);
      const token = config?.channel_access_token;
      if (!token) return jsonError("LINE Channel Access Token is not configured.");

      let sent = 0, failed = 0;
      const errors: string[] = [];
      for (const t of targets) {
        const result = await sendLinePushMessage(token, t.line_user_id, msgText);
        await supabase.from("line_message_logs").insert({
          influencer_id: t.influencer_id || null,
          line_user_id: t.line_user_id,
          message_type: "manual",
          message_content: msgText,
          status: result.ok ? "sent" : "failed",
          error_detail: result.error || null,
          sent_by: body.sent_by || "admin",
        });
        if (result.ok) sent++;
        else { failed++; errors.push(`${t.line_user_id}: ${result.error}`); }
      }
      return jsonOk({ sent, failed, errors });
    }

    // --- Single send (legacy) ---
    const { line_user_id, message, influencer_id, message_type, sent_by } = body;
    if (!line_user_id || !message) {
      return jsonError("line_user_id and message are required");
    }

    const config = await getLineConfig(supabase);
    const token = config?.channel_access_token;
    if (!token) return jsonError("LINE Channel Access Token is not configured. Please set it in LINE設定.");

    const result = await sendLinePushMessage(token, line_user_id, message);

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
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return jsonOk({ success: true });
  } catch (e) {
    console.error("send-line-message error:", e);
    return jsonError(e.message || "Internal error", 500);
  }
});

function jsonOk(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
