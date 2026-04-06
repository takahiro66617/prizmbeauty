import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useExternalNotifications, useMarkNotificationRead } from "@/hooks/useExternalNotifications";
import { supabase } from "@/integrations/supabase/client";

export default function ClientNotifications() {
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setAuthUserId(data.user.id);
    });
  }, []);

  const { data: notifications = [], isLoading } = useExternalNotifications(authUserId);
  const markRead = useMarkNotificationRead();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">お知らせ</h1>
        <p className="text-gray-500 mt-1">事務局からのお知らせを確認できます。</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`bg-white p-6 rounded-xl border shadow-sm cursor-pointer transition-colors ${!notif.read ? "border-blue-200 bg-blue-50/30" : "border-gray-100"}`}
              onClick={() => {
                if (!notif.read) markRead.mutate(notif.id);
                if (notif.link) window.location.href = notif.link;
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notif.read ? "bg-blue-500" : "bg-gray-300"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{notif.title}</h3>
                    {!notif.read && <Badge className="bg-blue-100 text-blue-700 text-[10px]">未読</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(notif.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <Bell className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-500">お知らせはまだありません。</p>
        </div>
      )}
    </div>
  );
}
