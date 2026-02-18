import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabaseExternal } from "@/lib/supabaseExternal";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const GENRES = [
  "ダンス","Vlog","美容・コスメ","動物","赤ちゃん・子ども",
  "カップル・夫婦","お笑い","アニメ・漫画","芸能・エンタメ",
  "映画・ドラマ","フィットネス・健康","音楽","お金・投資",
  "スポーツ","ゲーム","アート",
];

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl: string | null;
}

export default function RegisterProfile() {
  const navigate = useNavigate();
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("lineProfile");
    if (!stored) {
      navigate("/auth/login");
      return;
    }
    const profile = JSON.parse(stored) as LineProfile;
    setLineProfile(profile);
    setNickname(profile.displayName || "");
  }, [navigate]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const isValid =
    lastName && firstName && nickname && gender && birthDate && prefecture && selectedGenres.length > 0;

  const handleSubmit = async () => {
    if (!isValid || !lineProfile) return;
    setIsSubmitting(true);

    try {
      const { data, error } = await supabaseExternal
        .from("influencers")
        .insert({
          user_id: lineProfile.userId,
          line_user_id: lineProfile.userId,
          username: nickname,
          name: `${lastName} ${firstName}`,
          nickname,
          gender,
          birth_date: birthDate,
          prefecture,
          image_url: lineProfile.pictureUrl || null,
          category: selectedGenres.join(","),
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        alert("登録に失敗しました。もう一度お試しください。");
        setIsSubmitting(false);
        return;
      }

      // Store session
      const mockUser = {
        id: data.id,
        lastName,
        firstName,
        name: `${lastName} ${firstName}`,
        email: "",
        profileImagePreview:
          lineProfile.pictureUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(lastName)}&background=FFD6E8&color=333`,
        type: "influencer",
      };
      sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
      sessionStorage.removeItem("lineProfile");
      navigate("/mypage");
    } catch {
      alert("エラーが発生しました");
      setIsSubmitting(false);
    }
  };

  if (!lineProfile) return null;

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
          {/* Avatar */}
          {lineProfile.pictureUrl && (
            <div className="flex justify-center">
              <img
                src={lineProfile.pictureUrl}
                alt="プロフィール"
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
              />
            </div>
          )}

          {/* 姓名 */}
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

          {/* ニックネーム */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">ニックネーム <span className="text-destructive">*</span></Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="はなちゃん" />
          </div>

          {/* 性別 */}
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

          {/* 生年月日 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">生年月日 <span className="text-destructive">*</span></Label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          {/* 居住地 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">居住地 <span className="text-destructive">*</span></Label>
            <Select value={prefecture} onValueChange={setPrefecture}>
              <SelectTrigger>
                <SelectValue placeholder="都道府県を選択" />
              </SelectTrigger>
              <SelectContent>
                {PREFECTURES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ジャンル */}
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
