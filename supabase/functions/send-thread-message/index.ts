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
    const { applicationId, senderProfileId, content } = await req.json();
    if (!applicationId || !content) {
      return new Response(JSON.stringify({ error: "Missing applicationId or content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get application to determine sender/receiver
    const { data: app, error: appError } = await supabaseAdmin
      .from("applications")
      .select("*, campaigns(companies(id, user_id)), influencer_profiles(id, user_id)")
      .eq("id", applicationId)
      .single();

    if (appError) throw appError;

    // Check if application is completed - no new messages allowed
    if (app.status === "completed") {
      return new Response(JSON.stringify({ error: "この案件は完了しています。メッセージを送信できません。" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let senderId: string;
    let receiverId: string;

    const companyUserId = app.campaigns?.companies?.user_id;
    const influencerUserId = app.influencer_profiles?.user_id || app.influencer_profiles?.id;

    if (senderProfileId) {
      // LINE-auth influencer sending
      senderId = senderProfileId;
      receiverId = companyUserId;
    } else {
      // Will be determined by auth header for Supabase-auth users
      // For now, check authorization header
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          senderId = user.id;
          // Determine receiver based on who the sender is
          if (senderId === companyUserId) {
            receiverId = influencerUserId;
          } else {
            receiverId = companyUserId;
          }
        } else {
          throw new Error("Unauthorized");
        }
      } else {
        throw new Error("Unauthorized");
      }
    }

    const { data, error } = await supabaseAdmin.from("messages").insert({
      sender_id: senderId!,
      receiver_id: receiverId!,
      content,
      application_id: applicationId,
    }).select().single();

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
