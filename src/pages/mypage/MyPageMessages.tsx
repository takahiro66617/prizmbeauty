import { MessageCircle } from "lucide-react";

export default function MyPageMessages() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
        <MessageCircle className="w-8 h-8 text-blue-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-800">メッセージ</h1>
      <p className="text-gray-500">
        現在、新着メッセージはありません。<br />企業からの連絡をお待ちください。
      </p>
    </div>
  );
}
