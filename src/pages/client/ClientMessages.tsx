import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send } from "lucide-react";
import { getMessagesForUser, getInfluencerById } from "@/lib/mockData";

export default function ClientMessages() {
  const companyId = sessionStorage.getItem("client_company_id") || "c1";
  const messages = getMessagesForUser(companyId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = messages.find(m => m.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">メッセージ</h1>
        <p className="text-gray-500 mt-1">インフルエンサーとのやり取りを管理します。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {messages.length > 0 ? messages.map(msg => {
            const isReceived = msg.receiverId === companyId;
            const otherName = isReceived
              ? (getInfluencerById(msg.senderId)?.name || msg.senderId)
              : (getInfluencerById(msg.receiverId)?.name || msg.receiverId);
            return (
              <Card key={msg.id}
                className={`p-4 cursor-pointer transition-all border-0 shadow-sm hover:shadow-md ${selectedId === msg.id ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedId(msg.id)}>
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm truncate">{otherName}</span>
                  {!msg.read && isReceived && <Badge className="bg-red-500 text-white text-[10px]">新着</Badge>}
                </div>
                <p className="text-sm font-medium text-gray-700 truncate">{msg.subject}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleDateString("ja-JP")}</p>
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
                <h3 className="font-bold text-gray-900">{selected.subject}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selected.senderType === "company" ? "送信済み" : "受信"} - {new Date(selected.createdAt).toLocaleString("ja-JP")}
                </p>
              </div>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{selected.content}</div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input type="text" placeholder="返信を入力..." className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <Button className="bg-blue-600 hover:bg-blue-700"><Send className="w-4 h-4" /></Button>
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
    </div>
  );
}
