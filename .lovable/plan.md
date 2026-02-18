

# LINE認証によるインフルエンサー登録・ログイン実装計画

## 概要

画像で示されたgetpopのような流れで、LINEログインを使ったインフルエンサーの新規登録・ログインを実装します。

## ユーザーフロー

```text
[ログインページ] → [LINEでログイン/新規登録ボタン]
       ↓
[LINE認証画面] (LINEが自動表示・許可する)
       ↓
[コールバック処理] (Edge Functionでトークン交換)
       ↓
  ┌─ 既存ユーザー → [マイページダッシュボード]
  └─ 新規ユーザー → [プロフィール設定ページ]
                          ↓
                    姓・名・ニックネーム
                    性別・生年月日
                    居住地（都道府県）
                    主な投稿ジャンル（複数選択）
                          ↓
                    [設定完了 → マイページへ]
```

## 実装内容

### 1. シークレット設定

LINE チャネルシークレット（`5723b465e50172286f90e8c8e0fcdbd8`）をバックエンドのシークレットとして安全に保存します。チャネルID（`2009141875`）はフロントエンドで使用します。

### 2. Edge Function作成: `line-auth`

LINEから返される認証コードをアクセストークンに交換し、ユーザープロフィールを取得するバックエンド処理です。

処理の流れ:
- フロントエンドから認証コードを受け取る
- LINE API (`https://api.line.me/oauth2/v2.1/token`) でトークンを取得
- LINE API (`https://api.line.me/v2/profile`) でユーザー情報（LINE ID、表示名、アイコン）を取得
- 外部データベースの `influencer_profiles` テーブルで LINE ID を検索
- 既存ユーザーなら情報を返す、新規なら「新規」フラグを返す

### 3. LINEコールバックページ: `/auth/line/callback`

LINEから認証コードを受け取り、Edge Functionに渡してトークン交換する画面です。ローディング表示をしながらバックグラウンドで処理します。

### 4. プロフィール設定ページ: `/auth/register/profile`

新規ユーザー向けのプロフィール入力フォームです（getpopの画像を参考）:
- 姓（必須）
- 名（必須）
- ニックネーム（必須）
- 性別（必須）: 女性 / 男性
- 生年月日（必須）
- 居住地（必須）: 都道府県選択
- 主な投稿ジャンル（必須・複数選択）: ダンス、Vlog、美容・コスメ、動物、赤ちゃん・子ども、カップル・夫婦、お笑い、アニメ・漫画、芸能・エンタメ、映画・ドラマ、フィットネス・健康、音楽、お金・投資、スポーツ、ゲーム、アート

設定完了後、外部データベースの `influencer_profiles` テーブルにINSERTしてマイページへ遷移します。

### 5. ログインページの更新: `/auth/login`

現在のモック処理を削除し、実際のLINE OAuth認証URLにリダイレクトするように変更します。ボタンは「LINEでログイン/新規登録」に統一します。

### 6. LINE Developersコンソール設定（ユーザー作業）

コールバックURLを設定する必要があります:
`https://id-preview--ac83c3e4-c73b-40f6-be54-73af9493150e.lovable.app/auth/line/callback`

---

## 技術詳細

### LINE OAuth認証URL

```text
https://access.line.me/oauth2/v2.1/authorize
  ?response_type=code
  &client_id=2009141875
  &redirect_uri={callback_url}
  &state={random_state}
  &scope=profile openid
```

### Edge Function: `supabase/functions/line-auth/index.ts`

- 認証コードとリダイレクトURIを受け取る
- LINE Token API でアクセストークンを取得
- LINE Profile API でユーザー情報を取得
- 外部Supabaseの `influencer_profiles` テーブルで `user_id` (LINE userId) を検索
- 結果を返す（既存/新規 + LINEプロフィール情報）

### influencer_profiles テーブルの変更

現在のテーブルに以下のカラムが不足している可能性があります。外部Supabaseで追加SQLが必要になる場合があります:
- `line_user_id` (text) - LINE固有のユーザーID
- `nickname` (text) - ニックネーム
- `gender` (text) - 性別
- `birth_date` (date) - 生年月日
- `prefecture` (text) - 居住地

### 新規ファイル一覧

| ファイル | 内容 |
|---------|------|
| `supabase/functions/line-auth/index.ts` | LINEトークン交換Edge Function |
| `src/pages/auth/LineCallback.tsx` | LINEコールバック処理ページ |
| `src/pages/auth/RegisterProfile.tsx` | プロフィール設定ページ |

### 更新ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/pages/Login.tsx` | LINE OAuthリダイレクトに変更 |
| `src/App.tsx` | 新ルート追加 (`/auth/line/callback`, `/auth/register/profile`) |
| `src/hooks/useExternalInfluencers.ts` | LINE IDでの検索・新規登録mutationを追加 |

### 事前にユーザーが行う作業

LINE Developersコンソール（https://developers.line.biz/console/）で:
1. 該当チャネルの「LINE Login」設定を開く
2. コールバックURLに以下を追加:
   `https://id-preview--ac83c3e4-c73b-40f6-be54-73af9493150e.lovable.app/auth/line/callback`

