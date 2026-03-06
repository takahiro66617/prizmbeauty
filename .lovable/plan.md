

## 問題

フッターのリンクをクリックすると、React Routerはページ遷移時にスクロール位置をリセットしません。そのため、ページ下部のフッターからリンクを押すと、遷移先ページの途中や下部が表示されてしまいます。

## 修正内容

### 1. `src/components/ScrollToTop.tsx` を新規作成
- React Routerの `useLocation` を使い、パス変更時に `window.scrollTo(0, 0)` を実行するコンポーネント

### 2. `src/App.tsx` に `<ScrollToTop />` を追加
- `<BrowserRouter>` の直下に配置し、全ルート遷移でスクロールをトップにリセット

これだけで、フッターに限らず全てのページ遷移でスクロール位置がトップに戻ります。

