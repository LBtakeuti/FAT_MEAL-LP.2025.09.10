import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withAuth, jsonSuccess, jsonError, getPaginationParams, getQueryParam } from '@/lib/api-helpers';

type CustomerType = 'member' | 'guest' | 'tiktok';

interface UnifiedCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  customer_type: CustomerType;
  order_count: number;
  tiktok_order_count: number;
  total_spent: number;
  subscription_status: string | null;
  last_purchase_date: string | null;
  has_survey: boolean;
  created_at: string;
}

export const GET = withAuth(async (request: NextRequest) => {
  const supabase = createServerClient() as any;
  const { page, limit, offset } = getPaginationParams(request, 20);
  const search = getQueryParam(request, 'search');
  const typeFilter = getQueryParam(request, 'type');

  // Step 1: メールベースのユニーク顧客を収集
  const emailCustomers: Map<string, UnifiedCustomer> = new Map();

  // 1a. user_profiles（会員）
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, email, first_name, last_name, phone, created_at');

  for (const p of (profiles || [])) {
    const email = (p.email || '').toLowerCase();
    if (!email) continue;
    emailCustomers.set(email, {
      id: `member:${p.id}`,
      name: [p.last_name, p.first_name].filter(Boolean).join(' ') || '',
      email,
      phone: p.phone || null,
      customer_type: 'member',
      order_count: 0,
      tiktok_order_count: 0,
      total_spent: 0,
      subscription_status: null,
      last_purchase_date: null,
      has_survey: false,
      created_at: p.created_at,
    });
  }

  // 1b. orders（ゲスト含む）
  const { data: orders } = await supabase
    .from('orders')
    .select('customer_email, customer_name, amount, created_at')
    .not('stripe_session_id', 'like', 'sub_delivery_%');

  for (const o of (orders || [])) {
    const email = (o.customer_email || '').toLowerCase();
    if (!email) continue;
    const existing = emailCustomers.get(email);
    if (existing) {
      existing.order_count++;
      existing.total_spent += o.amount || 0;
      if (!existing.last_purchase_date || o.created_at > existing.last_purchase_date) {
        existing.last_purchase_date = o.created_at;
      }
      if (!existing.name && o.customer_name) existing.name = o.customer_name;
    } else {
      emailCustomers.set(email, {
        id: `guest:${email}`,
        name: o.customer_name || '',
        email,
        phone: null,
        customer_type: 'guest',
        order_count: 1,
        tiktok_order_count: 0,
        total_spent: o.amount || 0,
        subscription_status: null,
        last_purchase_date: o.created_at,
        has_survey: false,
        created_at: o.created_at,
      });
    }
  }

  // 1c. subscriptions（shipping_address.emailで紐づけ）
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('shipping_address, status, monthly_total_amount, started_at');

  for (const s of (subs || [])) {
    const addr = s.shipping_address as any;
    const email = (addr?.email || '').toLowerCase();
    if (!email) continue;
    const existing = emailCustomers.get(email);
    if (existing) {
      // アクティブが最優先
      if (s.status === 'active' || !existing.subscription_status) {
        existing.subscription_status = s.status;
      }
      if (!existing.name && addr?.name) existing.name = addr.name;
      if (!existing.phone && addr?.phone) existing.phone = addr.phone;
    } else {
      emailCustomers.set(email, {
        id: `guest:${email}`,
        name: addr?.name || '',
        email,
        phone: addr?.phone || null,
        customer_type: 'guest',
        order_count: 0,
        tiktok_order_count: 0,
        total_spent: 0,
        subscription_status: s.status,
        last_purchase_date: s.started_at,
        has_survey: false,
        created_at: s.started_at,
      });
    }
  }

  // 1d. purchase_surveys
  const { data: surveys } = await supabase
    .from('purchase_surveys')
    .select('customer_email');

  const surveyEmails = new Set((surveys || []).map((s: any) => (s.customer_email || '').toLowerCase()));
  for (const [email, customer] of emailCustomers) {
    if (surveyEmails.has(email)) customer.has_survey = true;
  }

  // Step 2: TikTok顧客（メールなし → 電話番号で既存マッチを試みる）
  const { data: tiktokOrders } = await supabase
    .from('tiktok_shop_orders')
    .select('id, recipient, first_name, last_name, phone, quantity, order_amount, created_time, status');

  // 電話番号正規化
  const normalizePhone = (p: string | null) => {
    if (!p) return '';
    const digits = p.replace(/[^0-9]/g, '');
    return digits.startsWith('81') ? '0' + digits.slice(2) : digits;
  };

  // 既存顧客の電話番号マップ
  const phoneToEmail: Map<string, string> = new Map();
  for (const [email, c] of emailCustomers) {
    const normalized = normalizePhone(c.phone);
    if (normalized) phoneToEmail.set(normalized, email);
  }

  // TikTok注文をグループ化（recipientごと）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tiktokGroups: Map<string, {
    name: string;
    phone: string;
    orders: any[];
    total_spent: number;
    last_date: string | null;
  }> = new Map();

  for (const t of (tiktokOrders || [])) {
    const name = t.recipient || [t.last_name, t.first_name].filter(Boolean).join(' ') || '';
    const phone = normalizePhone(t.phone);
    const key = phone || `name:${name}`;

    const group = tiktokGroups.get(key) || {
      name,
      phone,
      orders: [] as any[],
      total_spent: 0,
      last_date: null as string | null,
    };
    group.orders.push(t);
    const amount = parseFloat((t.order_amount || '0').replace(/[^0-9.]/g, '')) || 0;
    group.total_spent += amount;
    const dateStr = t.created_time ? t.created_time.slice(0, 10) : null;
    if (dateStr && (!group.last_date || dateStr > group.last_date)) group.last_date = dateStr;
    if (!group.name && name) group.name = name;
    tiktokGroups.set(key, group);
  }

  // TikTok顧客を統合
  for (const [key, group] of tiktokGroups) {
    const matchedEmail = group.phone ? phoneToEmail.get(group.phone) : undefined;
    if (matchedEmail) {
      // 既存顧客にTikTok注文を紐づけ
      const existing = emailCustomers.get(matchedEmail)!;
      existing.tiktok_order_count += group.orders.length;
      existing.total_spent += group.total_spent;
      if (group.last_date && (!existing.last_purchase_date || group.last_date > existing.last_purchase_date)) {
        existing.last_purchase_date = group.last_date;
      }
    } else {
      // 独立TikTok顧客
      emailCustomers.set(`tiktok:${key}`, {
        id: `tiktok:${key}`,
        name: group.name,
        email: null,
        phone: group.phone || null,
        customer_type: 'tiktok',
        order_count: 0,
        tiktok_order_count: group.orders.length,
        total_spent: group.total_spent,
        subscription_status: null,
        last_purchase_date: group.last_date,
        has_survey: false,
        created_at: group.last_date || new Date().toISOString(),
      });
    }
  }

  // Step 3: フィルタリング
  let customers = Array.from(emailCustomers.values());

  if (typeFilter) {
    customers = customers.filter(c => c.customer_type === typeFilter);
  }

  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  }

  // ソート: 最終購入日が新しい順
  customers.sort((a, b) => {
    const da = a.last_purchase_date || a.created_at;
    const db = b.last_purchase_date || b.created_at;
    return db.localeCompare(da);
  });

  const total = customers.length;
  const paged = customers.slice(offset, offset + limit);

  return jsonSuccess({
    customers: paged,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    summary: {
      total,
      members: customers.filter(c => c.customer_type === 'member').length,
      guests: customers.filter(c => c.customer_type === 'guest').length,
      tiktok: customers.filter(c => c.customer_type === 'tiktok').length,
    },
  });
});
