-- ambassadorsテーブルにInstagram/TikTok URLカラムを追加
ALTER TABLE public.ambassadors
ADD COLUMN instagram_url TEXT,
ADD COLUMN tiktok_url TEXT;
