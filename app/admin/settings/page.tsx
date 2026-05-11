'use client';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">管理設定</h1>
      <div className="bg-white rounded-lg shadow p-8">
        <p className="text-gray-600 mb-2">この画面は今後拡充される予定です。</p>
        <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
          <li>Slack 通知の宛先・チャンネル設定</li>
          <li>管理者ロール（viewer / operator / admin / super_admin）</li>
          <li>Stripe Webhook ヘルスステータス</li>
          <li>環境変数の死活チェック</li>
        </ul>
      </div>
    </div>
  );
}
