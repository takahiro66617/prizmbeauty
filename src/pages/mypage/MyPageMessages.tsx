import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send } from "lucide-react";
import { getMessagesForUser, getCompanyById, MOCK_USER } from "@/lib/mockData";

export default function MyPageMessages() {
  const userId = JSON.parse(sessionStorage.getItem("currentUser") || "null")?.id || MOCK_USER.id;
  const messages = getMessagesForUser(userId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = messages.find(m => m.id === selectedId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">メッセージ</h1>

      {messages.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {messages.map(msg => {
              const isReceived = msg.receiverId === userId;
              const otherName = isReceived
                ? (getCompanyById(msg.senderId)?.name || msg.senderId)
                : (getCompanyById(msg.receiverId)?.name || msg.receiverId);
              return (
                <Card key={msg.id}
                  className={`p-4 cursor-pointer transition-all border-0 shadow-sm hover:shadow-md ${selectedId === msg.id ? "ring-2 ring-pink-500" : ""}`}
                  onClick={() => setSelectedId(msg.id)}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm truncate">{otherName}</span>
                    {!msg.read && isReceived && <Badge className="bg-red-500 text-white text-[10px]">新着</Badge>}
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate">{msg.subject}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleDateString("ja-JP")}</p>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <Card className="p-6 border-0 shadow-lg">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-bold text-gray-900">{selected.subject}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {selected.senderType === "influencer" ? "送信済み" : "受信"} - {new Date(selected.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>
                <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{selected.content}</div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input type="text" placeholder="返信を入力..." className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    <Button className="bg-pink-500 hover:bg-pink-400"><Send className="w-4 h-4" /></Button>
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
