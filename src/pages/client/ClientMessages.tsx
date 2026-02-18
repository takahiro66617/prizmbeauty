import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send } from "lucide-react";
import { useExternalMessages, useSendMessage, ExternalMessage } from "@/hooks/useExternalMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserInfo { id: string; name: string; type: "influencer" | "company" }

export default function ClientMessages() {
  const { data: messages = [], isLoading } = useExternalMessages();
  const sendMessage = useSendMessage();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({});
  const [authUserId, setAuthUserId] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuthUserId(session.user.id);
    });
  }, []);

  // Build user map from unique IDs in messages
  useEffect(() => {
    if (messages.length === 0 || !authUserId) return;
    const ids = new Set<string>();
    messages.forEach(m => { ids.add(m.sender_id); ids.add(m.receiver_id); });
    ids.delete(authUserId);
    const lookupUsers = async () => {
      const idArr = Array.from(ids);
      const map: Record<string, UserInfo> = {};
      // Lookup influencers
      const { data: infs } = await supabase.from("influencer_profiles").select("id, name, user_id").in("user_id", idArr);
      infs?.forEach(i => { if (i.user_id) map[i.user_id] = { id: i.user_id, name: i.name, type: "influencer" }; });
      // Lookup companies  
      const { data: comps } = await supabase.from("companies").select("id, name, user_id").in("user_id", idArr);
      comps?.forEach(c => { map[c.user_id] = { id: c.user_id, name: c.name, type: "company" }; });
      setUserMap(map);
    };
    lookupUsers();
  }, [messages, authUserId]);

  const getName = (id: string) => userMap[id]?.name || id.slice(0, 8);

  // Group into threads by conversation partner
  const threads = new Map<string, ExternalMessage[]>();
  messages.forEach(m => {
    const partnerId = m.sender_id === authUserId ? m.receiver_id : m.sender_id;
    if (!threads.has(partnerId)) threads.set(partnerId, []);
    threads.get(partnerId)!.push(m);
  });

  const threadList = Array.from(threads.entries()).map(([partnerId, msgs]) => ({
    partnerId,
    messages: msgs,
    latest: msgs[0],
    unread: msgs.some(m => !m.read && m.receiver_id === authUserId),
  }));

  const selectedMessages = selectedThread ? (threads.get(selectedThread) || []) : [];

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedThread) return;
    sendMessage.mutate({ receiver_id: selectedThread, content: replyText }, {
      onSuccess: () => { toast.success("送信しました"); setReplyText(""); },
      onError: () => toast.error("送信に失敗しました"),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">メッセージ</h1>
        <p className="text-gray-500 mt-1">インフルエンサーとのやり取りを管理します。</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {threadList.length > 0 ? threadList.map(t => (
              <Card key={t.partnerId}
                className={`p-4 cursor-pointer transition-all border-0 shadow-sm hover:shadow-md ${selectedThread === t.partnerId ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedThread(t.partnerId)}>
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm truncate">{getName(t.partnerId)}</span>
                  {t.unread && <Badge className="bg-red-500 text-white text-[10px]">新着</Badge>}
                </div>
                <p className="text-sm text-gray-700 truncate">{t.latest.content.slice(0, 50)}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(t.latest.created_at).toLocaleDateString("ja-JP")}</p>
              </Card>
            )) : (
              <div className="text-center py-12 text-gray-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                <p>メッセージはありません</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedThread ? (
              <Card className="p-6 border-0 shadow-lg">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-bold text-gray-900">{getName(selectedThread)}</h3>
                </div>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {[...selectedMessages].reverse().map(msg => (
                    <div key={msg.id} className={`p-3 rounded-lg ${msg.sender_id === authUserId ? "bg-blue-50 ml-8" : "bg-gray-50 mr-8"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{msg.sender_id === authUserId ? "あなた" : getName(msg.sender_id)}</span>
                        <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString("ja-JP")}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="返信を入力..."
                      onKeyDown={e => e.key === "Enter" && handleSendReply()}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSendReply} disabled={sendMessage.isPending}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                メッセージを選択してください
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
