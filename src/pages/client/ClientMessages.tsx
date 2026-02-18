import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send } from "lucide-react";
import { useExternalMessages, useSendMessage } from "@/hooks/useExternalMessages";
import { toast } from "sonner";

export default function ClientMessages() {
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: messages = [], isLoading } = useExternalMessages(companyId);
  const sendMessage = useSendMessage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const selected = messages.find(m => m.id === selectedId);

  const handleSendReply = () => {
    if (!replyText.trim() || !selected) return;
    const receiverId = selected.sender_id === companyId ? selected.receiver_id : selected.sender_id;
    sendMessage.mutate({
      sender_id: companyId,
      receiver_id: receiverId,
      content: replyText,
    }, {
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
            {messages.length > 0 ? messages.map(msg => {
              const isReceived = msg.receiver_id === companyId;
              return (
                <Card key={msg.id}
                  className={`p-4 cursor-pointer transition-all border-0 shadow-sm hover:shadow-md ${selectedId === msg.id ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => setSelectedId(msg.id)}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm truncate">{isReceived ? msg.sender_id.slice(0, 8) : msg.receiver_id.slice(0, 8)}</span>
                    {!msg.read && isReceived && <Badge className="bg-red-500 text-white text-[10px]">新着</Badge>}
                  </div>
                  <p className="text-sm text-gray-700 truncate">{msg.content.slice(0, 50)}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleDateString("ja-JP")}</p>
                </Card>
              );
            }) : (
              <div className="text-center py-12 text-gray-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                <p>メッセージはありません</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <Card className="p-6 border-0 shadow-lg">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <p className="text-xs text-gray-500 mt-1">
                    {selected.sender_id === companyId ? "送信済み" : "受信"} - {new Date(selected.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
                <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{selected.content}</div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="返信を入力..."
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
