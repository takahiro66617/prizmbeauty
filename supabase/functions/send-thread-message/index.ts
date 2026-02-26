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
    const { applicationId, senderProfileId, content, imageUrl, imageUrls, messageType, visibility, targetType } = await req.json();
    if (!applicationId || (!content && !imageUrl && (!imageUrls || imageUrls.length === 0))) {
      return new Response(JSON.stringify({ error: "Missing applicationId or content/imageUrl" }), {
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

    // Check if application is completed
    if (app.status === "completed") {
      return new Response(JSON.stringify({ error: "この案件は完了しています。メッセージを送信できません。" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let senderId: string;
    let receiverId: string;
    let msgVisibility = visibility || "all";

    const companyUserId = app.campaigns?.companies?.user_id;
    const influencerUserId = app.influencer_profiles?.user_id || app.influencer_profiles?.id;

    if (senderProfileId) {
      // LINE-auth influencer sending
      senderId = senderProfileId;
      receiverId = companyUserId;
      // For admin_influencer visibility, keep companyUserId as receiver
      // Visibility field controls who can see the message
    } else {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          senderId = user.id;
          
          // Check if sender is admin
          const { data: roleData } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();
          
          const isAdmin = !!roleData;
          
          if (isAdmin) {
            // Admin sending - targetType determines recipient and visibility
            if (targetType === "company") {
              receiverId = companyUserId;
              msgVisibility = "admin_company";
            } else if (targetType === "influencer") {
              receiverId = influencerUserId;
              msgVisibility = "admin_influencer";
            } else {
              receiverId = companyUserId;
              msgVisibility = "all";
            }
          } else if (senderId === companyUserId) {
            // Company sending - always to admin (private)
            receiverId = influencerUserId;
            if (msgVisibility !== "all") {
              msgVisibility = "admin_company";
            }
          } else {
            // Influencer sending via supabase auth
            receiverId = companyUserId;
            if (msgVisibility !== "all") {
              msgVisibility = "admin_influencer";
            }
          }
        } else {
          throw new Error("Unauthorized");
        }
      } else {
        throw new Error("Unauthorized");
      }
    }

    // Handle multiple images - create one message per image, or one message with first image
    const finalImageUrl = imageUrl || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : null);
    
    const { data, error } = await supabaseAdmin.from("messages").insert({
      sender_id: senderId!,
      receiver_id: receiverId!,
      content: content || "",
      application_id: applicationId,
      image_url: finalImageUrl || null,
      message_type: messageType || "text",
      visibility: msgVisibility,
    }).select().single();

    if (error) throw error;

    // If there are additional images, create separate messages for them
    if (imageUrls && imageUrls.length > 1) {
      const additionalMessages = imageUrls.slice(1).map((url: string) => ({
        sender_id: senderId!,
        receiver_id: receiverId!,
        content: "",
        application_id: applicationId,
        image_url: url,
        message_type: messageType || "text",
        visibility: msgVisibility,
      }));
      await supabaseAdmin.from("messages").insert(additionalMessages);
    }

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
