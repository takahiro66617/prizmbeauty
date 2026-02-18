import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ClientMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [userId, setUserId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(display_name), receiver:profiles!messages_receiver_id_fkey(display_name)")
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false });
      setMessages(data || []);
    };
    load();
  }, []);

  const selected = messages.find(m => m.id === selectedId);

  const handleSend = async () => {
    if (!reply.trim() || !selected) return;
    const receiverId = selected.sender_id === userId ? selected.receiver_id : selected.sender_id;
    const { error } = await supabase.from("messages").insert({ sender_id: userId, receiver_id: receiverId, content: reply });
    if (error) { toast({ title: "送信に失敗しました", variant: "destructive" }); return; }
    toast({ title: "送信しました" });
    setReply("");
    // Reload
    const { data } = await supabase.from("messages").select("*, sender:profiles!messages_sender_id_fkey(display_name), receiver:profiles!messages_receiver_id_fkey(display_name)")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order("created_at", { ascending: false });
    setMessages(data || []);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">メッセージ</h1><p className="text-gray-500 mt-1">インフルエンサーとのやり取りを管理します。</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {messages.length > 0 ? messages.map(msg => {
            const isReceived = msg.receiver_id === userId;
            const otherName = isReceived ? msg.sender?.display_name : msg.receiver?.display_name;
            return (
              <Card key={msg.id} className={`p-4 cursor-pointer transition-all border-0 shadow-sm hover:shadow-md ${selectedId === msg.id ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedId(msg.id)}>
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm truncate">{otherName || "不明"}</span>
                  {!msg.read && isReceived && <Badge className="bg-red-500 text-white text-[10px]">新着</Badge>}
                </div>
                <p className="text-sm text-gray-700 truncate">{msg.content}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleDateString("ja-JP")}</p>
              </Card>
            );
          }) : (
            <div className="text-center py-12 text-gray-400"><MessageCircle className="w-8 h-8 mx-auto mb-2" /><p>メッセージはありません</p></div>
          )}
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
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={e => e.key === "Enter" && handleSend()} />
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSend}><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">メッセージを選択してください</div>
          )}
        </div>
      </div>
    </div>
  );
}
