import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MyPageFavorites() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center">
        <Heart className="w-8 h-8 text-pink-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-800">お気に入り</h1>
      <p className="text-gray-500">
        まだお気に入り登録された案件はありません。<br />気になる案件を見つけてリストに追加しましょう。
      </p>
      <Link to="/campaigns">
        <Button className="mt-4 bg-pink-500 text-white hover:bg-pink-300 transition-colors shadow-sm px-8">案件を探す</Button>
      </Link>
    </div>
  );
}
