-- share_links にメッセージ機能を追加（個別メッセージ統合）
--
-- title: 公開ページのH1見出し（任意・null可）。空なら label をフォールバック
-- body_html: サーバー側で sanitize-html 済みの本文HTML。空文字 = メッセージなし

ALTER TABLE public.share_links
  ADD COLUMN title TEXT,
  ADD COLUMN body_html TEXT NOT NULL DEFAULT '';
