import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GENRES } from "@/lib/constants";
import { buildLineOAuthUrl } from "@/lib/lineAuth";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

export default function RegisterProfile() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    // Check if user came through the add-friend flow
    const friendAdded = localStorage.getItem("lineFriendAdded");
    if (!friendAdded) {
      navigate("/auth/login");
      return;
    }
  }, [navigate]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const isValid =
    lastName && firstName && nickname && gender && birthDate && prefecture && selectedGenres.length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      // Save profile data to sessionStorage, then redirect to LINE OAuth
      const profileData = {
        lastName,
        firstName,
        nickname,
        name: `${lastName} ${firstName}`,
        category: selectedGenres.join(", "),
        bio: "",
        gender,
        birthDate,
        prefecture,
      };
      localStorage.setItem("pendingRegistration", JSON.stringify(profileData));

      // Redirect to LINE OAuth (aggressive bot_prompt for friend-add)
      window.location.href = buildLineOAuthUrl("aggressive");
    } catch {
      alert("エラーが発生しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink/30 via-card to-pastel-blue/30 py-8 px-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold gradient-text">プロフィール設定</h1>
          <p className="text-muted-foreground text-sm">
            あなたの情報を入力して登録を完了しましょう
          </p>
        </div>

        <Card className="p-6 shadow-xl border-0 bg-card/90 backdrop-blur-sm rounded-2xl space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">姓 <span className="text-destructive">*</span></Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="山田" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">名 <span className="text-destructive">*</span></Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="花子" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">ニックネーム <span className="text-destructive">*</span></Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="はなちゃん" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">性別 <span className="text-destructive">*</span></Label>
            <div className="flex gap-3">
              {["女性", "男性"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    gender === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">生年月日 <span className="text-destructive">*</span></Label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">居住地 <span className="text-destructive">*</span></Label>
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="" disabled>都道府県を選択</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              主な投稿ジャンル <span className="text-destructive">*</span>
              <span className="text-muted-foreground font-normal ml-1">（複数選択可）</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedGenres.includes(genre)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 text-base font-bold mt-4"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "登録を完了する"
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}
