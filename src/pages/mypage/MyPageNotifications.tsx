import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useExternalNotifications, useMarkNotificationRead } from "@/hooks/useExternalNotifications";
import { supabase } from "@/integrations/supabase/client";

export default function MyPageNotifications() {
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get auth user_id (not influencer_profiles.id)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuthUserId(session.user.id);
    });
  }, []);

  const { data: notifications = [], isLoading } = useExternalNotifications(authUserId);
  const markRead = useMarkNotificationRead();

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "message": return <Badge className="bg-blue-100 text-blue-700 text-[10px]">メッセージ</Badge>;
      case "success": return <Badge className="bg-green-100 text-green-700 text-[10px]">採用</Badge>;
      case "application": return <Badge className="bg-pink-100 text-pink-700 text-[10px]">案件</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700 text-[10px]">システム</Badge>;
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">お知らせ</h1>
      <div className="space-y-4">
        {notifications.length > 0 ? notifications.map(notif => (
          <div key={notif.id}
            className={`bg-white p-6 rounded-xl border shadow-sm cursor-pointer transition-colors ${!notif.read ? "border-pink-200 bg-pink-50/30" : "border-gray-100"}`}
            onClick={() => { if (!notif.read) markRead.mutate(notif.id); }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {getTypeBadge(notif.type)}
                <h3 className="font-bold text-gray-800">{notif.title}</h3>
                {!notif.read && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">新着</span>}
              </div>
              <span className="text-sm text-gray-400 shrink-0 ml-4">{new Date(notif.created_at).toLocaleDateString("ja-JP")}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{notif.message}</p>
            {notif.link && (
              <Link to={notif.link} className="text-xs text-pink-500 hover:underline mt-2 inline-block">確認する →</Link>
            )}
          </div>
        )) : (
          <div className="text-center py-12 text-gray-500">お知らせはありません</div>
        )}
      </div>
    </div>
  );
}
