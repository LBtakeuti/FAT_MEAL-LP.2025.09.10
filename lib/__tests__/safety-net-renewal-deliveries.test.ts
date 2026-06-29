import { describe, it, expect } from 'vitest';
import {
  buildMissedRenewals,
  computeRenewalScheduledDate,
  type CycleInvoiceInput,
} from '../safety-net-renewal-deliveries';

// 指定の YYYY-MM-DD（UTC 00:00）の unix 秒を返すヘルパー
function unixUtc(dateStr: string): number {
  return Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000);
}

describe('computeRenewalScheduledDate（webhook と同一の配送日計算）', () => {
  it('preferred あり: 請求6/26・希望2日 → 翌月へ送って 7/2', () => {
    const result = computeRenewalScheduledDate('sub-6', '2026-04-02', unixUtc('2026-06-26'));
    expect(result).toBe('2026-07-02');
  });

  it('preferred なし（旧プラン）: 請求5/24 → 5/24（billingDate ベース）', () => {
    const result = computeRenewalScheduledDate('subscription-monthly-12', null, unixUtc('2026-05-24'));
    expect(result).toBe('2026-05-24');
  });
});

describe('buildMissedRenewals（invoice_id 単位の取りこぼし判定）', () => {
  const base = {
    subscriptionDbId: 'db-sub-1',
    stripeSubscriptionId: 'sub_stripe_1',
    customerEmail: 'taro@example.com',
  };

  it('preferred ありの会員: 作成 scheduled_date が webhook と一致（二重作成しない値）', () => {
    const invoices: CycleInvoiceInput[] = [
      {
        id: 'in_001',
        billingReason: 'subscription_cycle',
        status: 'paid',
        subscriptionId: 'sub_stripe_1',
        periodStartUnix: unixUtc('2026-06-26'),
        amountPaid: 5100,
      },
    ];
    const missed = buildMissedRenewals({
      ...base,
      planId: 'sub-6',
      preferred: '2026-04-02',
      invoices,
      existingInvoiceIds: new Set<string>(),
    });
    expect(missed).toHaveLength(1);
    expect(missed[0].row.scheduled_date).toBe('2026-07-02');
    expect(missed[0].row.preferred_delivery_date).toBe('2026-07-02');
    expect(missed[0].row.stripe_invoice_id).toBe('in_001');
    expect(missed[0].row.subscription_id).toBe('db-sub-1');
    expect(missed[0].row.meals_per_delivery).toBe(6);
    expect(missed[0].row.quantity).toBe(1);
    expect(missed[0].row.status).toBe('pending');
    expect(missed[0].row.customer_email).toBe('taro@example.com');
  });

  it('preferred なし（旧プラン）: 請求5/24 → scheduled_date=5/24', () => {
    const invoices: CycleInvoiceInput[] = [
      {
        id: 'in_legacy',
        billingReason: 'subscription_cycle',
        status: 'paid',
        subscriptionId: 'sub_stripe_1',
        periodStartUnix: unixUtc('2026-05-24'),
        amountPaid: 9150,
      },
    ];
    const missed = buildMissedRenewals({
      ...base,
      planId: 'subscription-monthly-12',
      preferred: null,
      invoices,
      existingInvoiceIds: new Set<string>(),
    });
    expect(missed).toHaveLength(1);
    expect(missed[0].row.scheduled_date).toBe('2026-05-24');
  });

  it('既に同 invoice_id のレコードがある → 作成しない（スキップ）', () => {
    const invoices: CycleInvoiceInput[] = [
      {
        id: 'in_dup',
        billingReason: 'subscription_cycle',
        status: 'paid',
        subscriptionId: 'sub_stripe_1',
        periodStartUnix: unixUtc('2026-06-26'),
        amountPaid: 5100,
      },
    ];
    const missed = buildMissedRenewals({
      ...base,
      planId: 'sub-6',
      preferred: '2026-04-02',
      invoices,
      existingInvoiceIds: new Set<string>(['in_dup']),
    });
    expect(missed).toHaveLength(0);
  });

  it('subscription_create の invoice は対象外（subscription_cycle のみ）', () => {
    const invoices: CycleInvoiceInput[] = [
      {
        id: 'in_create',
        billingReason: 'subscription_create',
        status: 'paid',
        subscriptionId: 'sub_stripe_1',
        periodStartUnix: unixUtc('2026-04-26'),
        amountPaid: 5100,
      },
    ];
    const missed = buildMissedRenewals({
      ...base,
      planId: 'sub-6',
      preferred: '2026-04-02',
      invoices,
      existingInvoiceIds: new Set<string>(),
    });
    expect(missed).toHaveLength(0);
  });

  it('別サブスク / 未払い invoice は対象外', () => {
    const invoices: CycleInvoiceInput[] = [
      {
        id: 'in_other_sub',
        billingReason: 'subscription_cycle',
        status: 'paid',
        subscriptionId: 'sub_stripe_OTHER',
        periodStartUnix: unixUtc('2026-06-26'),
        amountPaid: 5100,
      },
      {
        id: 'in_unpaid',
        billingReason: 'subscription_cycle',
        status: 'open',
        subscriptionId: 'sub_stripe_1',
        periodStartUnix: unixUtc('2026-06-26'),
        amountPaid: 0,
      },
    ];
    const missed = buildMissedRenewals({
      ...base,
      planId: 'sub-6',
      preferred: '2026-04-02',
      invoices,
      existingInvoiceIds: new Set<string>(),
    });
    expect(missed).toHaveLength(0);
  });
});
