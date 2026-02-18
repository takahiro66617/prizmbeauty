import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Search, X } from "lucide-react";
import { useExternalAllMessages, useSendMessage } from "@/hooks/useExternalMessages";
import { useExternalInfluencers } from "@/hooks/useExternalInfluencers";
import { useExternalCompanies } from "@/hooks/useExternalCompanies";
import { toast } from "sonner";

export default function AdminMessages() {
  const { data: messages = [], isLoading } = useExternalAllMessages();
  const { data: influencers = [] } = useExternalInfluencers();
  const { data: companies = [] } = useExternalCompanies();
  const sendMessage = useSendMessage();
  const [search, setSearch] = useState("");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMsgReceiver, setNewMsgReceiver] = useState("");
  const [newMsgContent, setNewMsgContent] = useState("");
  const [showNewMsg, setShowNewMsg] = useState(false);

  const getName = (id: string) => {
    const inf = influencers.find(i => i.id === id);
    if (inf) return `IF: ${inf.name}`;
    const comp = companies.find(c => c.id === id);
    if (comp) return `企業: ${comp.name}`;
    return id.slice(0, 8);
  };

  // Group messages by conversation pairs
  const threads = new Map<string, typeof messages>();
  messages.forEach(m => {
    const key = [m.sender_id, m.receiver_id].sort().join("-");
    if (!threads.has(key)) threads.set(key, []);
    threads.get(key)!.push(m);
  });

  const threadList = Array.from(threads.entries()).map(([key, msgs]) => {
    const latest = msgs[0];
    const participants = key.split("-");
    return { key, messages: msgs, latest, participants };
  }).filter(t => {
    if (!search) return true;
    return t.participants.some(p => getName(p).toLowerCase().includes(search.toLowerCase()));
  });

  const selectedMessages = selectedThread ? threads.get(selectedThread) || [] : [];

  const handleSendNewMessage = () => {
    if (!newMsgReceiver || !newMsgContent.trim()) return;
    sendMessage.mutate({
      receiver_id: newMsgReceiver,
      content: newMsgContent,
    }, {
      onSuccess: () => { toast.success("送信しました"); setNewMsgContent(""); setShowNewMsg(false); },
      onError: () => toast.error("送信に失敗しました"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">メッセージ管理</h1>
          <p className="text-gray-500 mt-1">全てのメッセージを監視・管理します。個人間のやり取りは禁止されています。</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowNewMsg(true)}>
          <Send className="w-4 h-4 mr-2" />新規メッセージ
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="参加者名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          {isLoading ? <p className="text-center py-4 text-gray-400">読み込み中...</p> : (
            threadList.length > 0 ? threadList.map(t => (
              <Card key={t.key}
                className={`p-4 cursor-pointer transition-all border-0 shadow-sm hover:shadow-md ${selectedThread === t.key ? "ring-2 ring-purple-500" : ""}`}
                onClick={() => setSelectedThread(t.key)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex flex-col">
                    {t.participants.map(p => <span key={p} className="text-xs font-medium text-gray-700">{getName(p)}</span>)}
                  </div>
                  {t.messages.some(m => !m.read) && <Badge className="bg-red-500 text-white text-[10px]">未読</Badge>}
                </div>
                <p className="text-sm text-gray-600 truncate">{t.latest.content.slice(0, 50)}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(t.latest.created_at).toLocaleDateString("ja-JP")}</p>
              </Card>
            )) : (
              <div className="text-center py-12 text-gray-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                <p>メッセージはありません</p>
              </div>
            )
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedThread ? (
            <Card className="p-6 border-0 shadow-lg">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <p className="text-sm font-medium text-gray-700">スレッド参加者:</p>
                <div className="flex gap-2 mt-1">
                  {selectedThread.split("-").map(p => (
                    <Badge key={p} variant="outline" className="text-xs">{getName(p)}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {[...selectedMessages].reverse().map(msg => (
                  <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{getName(msg.sender_id)}</span>
                      <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString("ja-JP")}</span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
              スレッドを選択してください
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowNewMsg(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">新規メッセージ送信</h3>
              <button onClick={() => setShowNewMsg(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">送信先</label>
                <select value={newMsgReceiver} onChange={e => setNewMsgReceiver(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">選択してください</option>
                  <optgroup label="企業">
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                  <optgroup label="インフルエンサー">
                    {influencers.map(i => <option key={i.id} value={i.id}>{i.name} (@{i.username})</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メッセージ</label>
                <textarea value={newMsgContent} onChange={e => setNewMsgContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[100px]" placeholder="メッセージを入力..." />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewMsg(false)}>キャンセル</Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSendNewMessage} disabled={sendMessage.isPending}>
                <Send className="w-4 h-4 mr-2" />送信
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
