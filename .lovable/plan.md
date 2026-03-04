

## 問題の整理

ユーザーが指摘しているのは、LINEログインボタンを押した後の**遷移先ページ**が正しくないという点です。

### 現在のフロー
ログインボタン → `https://access.line.me/oauth2/v2.1/authorize?...&bot_prompt=aggressive` → LINE OAuth画面

`bot_prompt=aggressive` が正しく動作するには、**LINE Developersコンソールで「リンクされたボット（Linked Bot）」にPRizmの公式アカウント（@616jfxwh）が設定されている**必要があります。これが未設定の場合、OAuth画面に友だち追加オプションが一切表示されません。

### 技術的制約
LINE APIの仕様上、ブラウザから友だち追加する方法は以下の2つしかありません：

1. **`bot_prompt=aggressive`（OAuth統合型）** — 同意画面に友だち追加チェックボックスを表示。ブラウザ内で完結する。✅
2. **`line.me/R/ti/p/@616jfxwh`（ディープリンク型）** — LINEアプリのトーク画面に遷移。自動で戻る手段なし。❌

つまり、`bot_prompt=aggressive` が唯一のブラウザ完結型の友だち追加手段です。

### 修正計画

#### 1. LINE Developersコンソールの設定確認（手動作業）
`bot_prompt=aggressive` を機能させるには、LINE Developersコンソールで以下を確認する必要があります：
- LINE Loginチャネル（ID: 2009141875）の設定画面
- 「リンクされたボット（Linked Bot）」にPRizmの公式アカウントが紐づいているか
- 未設定の場合、ここに@616jfxwhのMessaging APIチャネルのボットを選択して保存

**これはコード側では修正できず、LINE Developers管理画面での設定が必要です。**

#### 2. コード側の補強
サーバー側（line-auth Edge Function）で友だち状態を検証し、未追加の場合はわかりやすいエラーメッセージとリトライボタンを表示する。現在のコードは既にこの実装があるが、エラー画面のUIを改善する：

- **LineCallback.tsx**: 友だち未追加時のエラー画面に「もう一度ログインする」ボタンを大きく表示し、「同意画面で『友だち追加』にチェックを入れてください」という具体的な手順を案内

#### 修正ファイル
- `src/pages/auth/LineCallback.tsx` — 友だち未追加時のエラーUIを改善

#### ユーザーに必要な手動作業
- LINE Developersコンソールで「Linked Bot」設定を確認・有効化

