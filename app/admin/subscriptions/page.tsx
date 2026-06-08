import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const usp = new URLSearchParams();
  // status / from / to を /admin/orders へ引き継ぐ。/admin/orders 側でサブスクタブとして表示される
  const passThrough = ['status', 'from', 'to'] as const;
  for (const key of passThrough) {
    const v = params[key];
    if (typeof v === 'string' && v) usp.set(key, v);
  }
  const qs = usp.toString();
  redirect(`/admin/orders${qs ? `?${qs}` : ''}`);
}
