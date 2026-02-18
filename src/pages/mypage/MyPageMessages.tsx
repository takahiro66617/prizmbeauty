import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function MyPageMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [userId, setUserId] = useState("");
  const { toast } = useToast();

  const loadMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);
    const { data } = await supabase.from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(display_name), receiver:profiles!messages_receiver_id_fkey(display_name)")
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false });
    setMessages(data || []);
  };

  useEffect(() => { loadMessages(); }, []);

  const selected = messages.find(m => m.id === selectedId);

  const handleSend = async () => {
    if (!reply.trim() || !selected) return;
    const receiverId = selected.sender_id === userId ? selected.receiver_id : selected.sender_id;
    await supabase.from("messages").insert({ sender_id: userId, receiver_id: receiverId, content: reply });
    toast({ title: "送信しました" });
    setReply("");
    loadMessages();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">メッセージ</h1>

      {messages.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {messages.map(msg => {
              const isReceived = msg.receiver_id === userId;
              const otherName = isReceived ? msg.sender?.display_name : msg.receiver?.display_name;
              return (
                <Card key={msg.id} className={`p-4 cursor-pointer transition-all border-0 shadow-sm hover:shadow-md ${selectedId === msg.id ? "ring-2 ring-pink-500" : ""}`}
                  onClick={() => setSelectedId(msg.id)}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm truncate">{otherName || "不明"}</span>
                    {!msg.read && isReceived && <Badge className="bg-red-500 text-white text-[10px]">新着</Badge>}
                  </div>
                  <p className="text-sm text-gray-700 truncate">{msg.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleDateString("ja-JP")}</p>
                </Card>
              );
            })}
          </div>
          <div className="lg:col-span-2">
            {selected ? (
              <Card className="p-6 border-0 shadow-lg">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <p className="text-xs text-gray-500">{selected.sender_id === userId ? "送信済み" : "受信"} - {new Date(selected.created_at).toLocaleString("ja-JP")}</p>
                </div>
                <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{selected.content}</div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input type="text" value={reply} onChange={e => setReply(e.target.value)} placeholder="返信を入力..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      onKeyDown={e => e.key === "Enter" && handleSend()} />
                    <Button className="bg-pink-500 hover:bg-pink-400" onClick={handleSend}><Send className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">メッセージを選択してください</div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center"><MessageCircle className="w-8 h-8 text-blue-500" /></div>
          <p className="text-gray-500">現在、新着メッセージはありません。<br />企業からの連絡をお待ちください。</p>
        </div>
      )}
    </div>
  );
}
