'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button, Badge, ConfirmDialog, LoadingSpinner, useToast } from '@/components/admin/ui';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

/** ISO 文字列 → datetime-local 入力用文字列（YYYY-MM-DDTHH:mm、ローカル時刻）に変換 */
function formatDateTimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local の値 → ISO 文字列（空なら null） */
function datetimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

interface ShareLink {
  id: string;
  slug: string;
  label: string | null;
  title: string | null;
  body_html: string;
  expires_at: string | null;
  created_at: string;
}

interface SharePhoto {
  id: string;
  share_link_id: string;
  file_path: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  uploaded_at: string;
  url: string | null;
}

interface ShareStats {
  total_access: number;
  unique_access: number;
  total_downloads: number;
  single_downloads: number;
  zip_downloads: number;
  daily_access: Array<{ date: string; count: number }>;
  daily_downloads: Array<{ date: string; count: number }>;
}

export default function AdminShareLinkDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [link, setLink] = useState<ShareLink | null>(null);
  const [photos, setPhotos] = useState<SharePhoto[]>([]);
  const [stats, setStats] = useState<ShareStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    filename: string;
    percent: number;
  } | null>(null);
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<SharePhoto | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // 編集 state（基本情報＋メッセージ）
  const [editSlug, setEditSlug] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState(''); // datetime-local 形式
  const [savingInfo, setSavingInfo] = useState(false);
  const initializedRef = useRef(false);

  // 初回のみ link の値を編集 state へ反映（再読込で編集中の入力を消さない）
  useEffect(() => {
    if (link && !initializedRef.current) {
      setEditSlug(link.slug);
      setEditLabel(link.label ?? '');
      setEditTitle(link.title ?? '');
      setEditBody(link.body_html ?? '');
      setEditExpiresAt(formatDateTimeLocal(link.expires_at));
      initializedRef.current = true;
    }
  }, [link]);

  /** 全体（link/photos/stats）再読込。新規ページ表示などで使う */
  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [detailRes, statsRes] = await Promise.all([
        fetch(`/api/admin/share-links/${slug}`),
        fetch(`/api/admin/share-links/${slug}/stats`),
      ]);
      if (detailRes.ok) {
        const data = await detailRes.json();
        setLink(data.link);
        setPhotos(data.photos || []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  /** photos と stats のみ再読込（link は触らない＝編集中の入力を保持） */
  const reloadPhotosAndStats = useCallback(async () => {
    if (!slug) return;
    try {
      const [detailRes, statsRes] = await Promise.all([
        fetch(`/api/admin/share-links/${slug}`),
        fetch(`/api/admin/share-links/${slug}/stats`),
      ]);
      if (detailRes.ok) {
        const data = await detailRes.json();
        setPhotos(data.photos || []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error(e);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  /** 1ファイルを Supabase Storage に直接 PUT。XMLHttpRequest で進捗イベントを取る */
  const putToSignedUrl = (signedUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`upload failed: ${xhr.status} ${xhr.statusText}`));
      };
      xhr.onerror = () => reject(new Error('upload network error'));
      xhr.send(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const successes: string[] = [];
    const failures: Array<{ filename: string; message: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length, filename: file.name, percent: 0 });

      try {
        // 1) 署名URL発行
        const signRes = await fetch(`/api/admin/share-links/${slug}/photos/sign-upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mime_type: file.type,
            size_bytes: file.size,
          }),
        });
        const signData = await signRes.json().catch(() => ({}));
        if (!signRes.ok || !signData?.signed_url) {
          failures.push({ filename: file.name, message: signData?.message || '署名URL発行に失敗' });
          continue;
        }

        // 2) Supabase Storage に直接PUT
        await putToSignedUrl(signData.signed_url, file, (pct) => {
          setUploadProgress((prev) => prev && prev.filename === file.name ? { ...prev, percent: pct } : prev);
        });

        // 3) サーバーに完了通知して photos テーブルに登録
        const confirmRes = await fetch(`/api/admin/share-links/${slug}/photos/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_path: signData.file_path,
            filename: file.name,
            mime_type: file.type || null,
            size_bytes: file.size,
          }),
        });
        const confirmData = await confirmRes.json().catch(() => ({}));
        if (!confirmRes.ok) {
          failures.push({ filename: file.name, message: confirmData?.message || '登録に失敗' });
          continue;
        }
        successes.push(file.name);
      } catch (err) {
        console.error(err);
        failures.push({
          filename: file.name,
          message: err instanceof Error ? err.message : 'アップロード失敗',
        });
      }
    }

    setUploadProgress(null);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (successes.length > 0) toast.success(`${successes.length}件アップロードしました`);
    if (failures.length > 0) {
      const summary = failures.map((f) => `${f.filename}: ${f.message}`).join(' / ');
      toast.error(`${failures.length}件失敗: ${summary}`);
    }

    await reloadPhotosAndStats();
  };

  const confirmDeletePhoto = async () => {
    if (!deletePhotoTarget) return;
    try {
      const res = await fetch(`/api/admin/share-links/${slug}/photos/${deletePhotoTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('写真を削除しました');
        await reloadPhotosAndStats();
      } else {
        toast.error('削除に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toast.error('削除に失敗しました');
    } finally {
      setDeletePhotoTarget(null);
    }
  };

  const handleSaveInfo = async () => {
    if (!link) return;
    setSavingInfo(true);
    try {
      const res = await fetch(`/api/admin/share-links/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editSlug,
          label: editLabel,
          title: editTitle,
          body_html: editBody,
          expires_at: datetimeLocalToIso(editExpiresAt),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('保存しました');
        // スラッグが変わったら新URLへ遷移
        if (data?.slug && data.slug !== slug) {
          router.replace(`/admin/share-links/${data.slug}`);
          return;
        }
        if (data) setLink(data);
      } else {
        toast.error(data?.message || '保存に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toast.error('保存に失敗しました');
    } finally {
      setSavingInfo(false);
    }
  };

  const copyShareUrl = async () => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/share/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('URLをコピーしました');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!link) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-500">個別メッセージが見つかりません</p>
      </div>
    );
  }

  const expired = link.expires_at ? new Date(link.expires_at).getTime() < Date.now() : false;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 戻るボタン */}
      <div>
        <Link
          href="/admin/share-links"
          className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md border border-gray-300 bg-white shadow-sm transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="10,3 5,8 10,13" />
          </svg>
          一覧に戻る
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/share-links" className="hover:underline hover:text-gray-700">個別メッセージ一覧</Link>
            <span>/</span>
            <span>{link.label || '（無題）'}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{link.label || '（無題）'}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500 mr-2">URL:</span>
              <a href={`/share/${slug}`} target="_blank" rel="noopener noreferrer" className="font-mono text-orange-600 hover:underline">
                /share/{slug}
              </a>
              <button onClick={copyShareUrl} className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline">
                {copied ? 'コピー済み' : 'コピー'}
              </button>
            </div>
            <div>
              <span className="text-gray-500 mr-2">作成日:</span>
              <span className="text-gray-700">{new Date(link.created_at).toLocaleString('ja-JP')}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-2">有効期限:</span>
              {link.expires_at ? (
                <span className={expired ? 'text-red-600 font-medium' : 'text-gray-700'}>
                  {new Date(link.expires_at).toLocaleString('ja-JP')}
                  {expired && <Badge variant="danger" className="ml-2">期限切れ</Badge>}
                </span>
              ) : (
                <span className="text-gray-400">無期限</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 統計サマリー */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-xs text-gray-500">総アクセス</div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total_access}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-xs text-gray-500">ユニークアクセス</div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.unique_access}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-xs text-gray-500">総DL</div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total_downloads}</div>
            <div className="text-xs text-gray-500 mt-1">単体 {stats.single_downloads} / ZIP {stats.zip_downloads}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-xs text-gray-500">写真</div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{photos.length}</div>
          </div>
        </div>
      )}

      {/* アクセスグラフ */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">アクセス推移（過去30日）</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.daily_access}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={10} />
                  <YAxis allowDecimals={false} fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#ea580c" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">ダウンロード推移（過去30日）</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.daily_downloads}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={10} />
                  <YAxis allowDecimals={false} fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 基本情報＋メッセージ編集 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">基本情報</h2>
          <Button onClick={handleSaveInfo} disabled={savingInfo}>
            {savingInfo ? '保存中...' : '保存'}
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL（スラッグ）<span className="text-xs text-gray-400 ml-2">（英数字とハイフン・6〜64文字。変更すると旧URLは無効になります）</span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500 font-mono whitespace-nowrap">/share/</span>
              <input
                type="text"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                maxLength={64}
                placeholder="例: saitama-koukou-2026spring"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ラベル<span className="text-xs text-gray-400 ml-2">（管理画面の識別用）</span>
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                maxLength={120}
                placeholder="例: テスト高校 春合宿"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                有効期限<span className="text-xs text-gray-400 ml-2">（空欄なら無期限）</span>
              </label>
              <input
                type="datetime-local"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル<span className="text-xs text-gray-400 ml-2">（任意・公開ページのH1見出し。空ならラベルが使われます）</span>
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={120}
              placeholder="例: 2026年春合宿 集合写真"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本文<span className="text-xs text-gray-400 ml-2">（任意・写真ゼロでも本文だけ表示されます）</span>
            </label>
            <RichTextEditor
              value={editBody}
              onChange={setEditBody}
              placeholder="部員のみなさんへのメッセージを入力..."
            />
          </div>
        </div>
      </div>

      {/* 写真管理 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">写真</h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'アップロード中...' : '写真を追加'}
            </Button>
          </div>
        </div>
        {uploadProgress && (
          <div className="px-6 py-3 border-b border-gray-100 bg-orange-50">
            <div className="flex justify-between items-center text-xs text-gray-700 mb-1">
              <span className="truncate">
                {uploadProgress.current} / {uploadProgress.total}: {uploadProgress.filename}
              </span>
              <span className="font-medium tabular-nums">{uploadProgress.percent}%</span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-600 h-2 rounded-full transition-[width] duration-200"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
          </div>
        )}
        <div className="p-6">
          {photos.length === 0 ? (
            <p className="text-center text-gray-500 py-12">写真がまだありません</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative rounded-lg overflow-hidden bg-gray-100 aspect-square">
                  {photo.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">読み込み失敗</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                    {photo.filename}
                  </div>
                  <button
                    onClick={() => setDeletePhotoTarget(photo)}
                    className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deletePhotoTarget}
        title="この写真を削除しますか？"
        description={deletePhotoTarget ? `「${deletePhotoTarget.filename}」を削除します。` : undefined}
        confirmLabel="削除する"
        variant="danger"
        onConfirm={confirmDeletePhoto}
        onCancel={() => setDeletePhotoTarget(null)}
      />
    </div>
  );
}
