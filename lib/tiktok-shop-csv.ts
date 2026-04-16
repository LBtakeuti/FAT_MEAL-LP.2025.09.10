import Papa from 'papaparse';

export interface TikTokShopRow {
  tiktok_order_id: string;
  order_status: string | null;
  order_substatus: string | null;
  sku_id: string | null;
  seller_sku: string | null;
  product_name: string | null;
  variation: string | null;
  quantity: number;
  sku_unit_original_price: string | null;
  sku_subtotal_after_discount: string | null;
  shipping_fee_after_discount: string | null;
  order_amount: string | null;
  payment_method: string | null;
  created_time: string | null;
  paid_time: string | null;
  rts_time: string | null;
  shipped_time: string | null;
  delivered_time: string | null;
  tracking_id: string | null;
  shipping_provider_name: string | null;
  buyer_username: string | null;
  recipient: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  zipcode: string | null;
  prefecture: string | null;
  county: string | null;
  city_ward: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  phone: string | null;
  product_category: string | null;
  package_id: string | null;
  seller_note: string | null;
  buyer_message: string | null;
}

/** TikTok Shop の日付は `04/14/2026 10:18:18 PM` 形式。ISO に変換 */
export function parseTikTokDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i
  );
  if (!match) return null;
  const [, mm, dd, yyyy, hhRaw, min, sec, ampm] = match;
  let hh = parseInt(hhRaw, 10);
  if (ampm.toUpperCase() === 'PM' && hh < 12) hh += 12;
  if (ampm.toUpperCase() === 'AM' && hh === 12) hh = 0;
  // 入力は日本時間（TikTok Shop JP）として扱い、ISO文字列に変換
  return `${yyyy}-${mm}-${dd}T${String(hh).padStart(2, '0')}:${min}:${sec}+09:00`;
}

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  return str;
}

function cleanRequired(value: unknown): string {
  return clean(value) || '';
}

interface ParseResult {
  rows: TikTokShopRow[];
  errors: string[];
}

/** TikTok Shop CSV をパースして行オブジェクトの配列に */
export function parseTikTokShopCsv(csvText: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = result.errors
    .filter((e) => e.type !== 'FieldMismatch' && e.code !== 'TooFewFields')
    .map((e) => `行${e.row ?? '?'}: ${e.message}`);

  const rows: TikTokShopRow[] = [];

  for (const r of result.data) {
    const orderId = cleanRequired(r['Order ID']);
    if (!orderId) continue;

    const quantityRaw = clean(r['Quantity']);
    const quantity = quantityRaw ? parseInt(quantityRaw.replace(/,/g, ''), 10) || 1 : 1;

    rows.push({
      tiktok_order_id: orderId,
      order_status: clean(r['Order Status']),
      order_substatus: clean(r['Order Substatus']),
      sku_id: clean(r['SKU ID']),
      seller_sku: clean(r['Seller SKU']),
      product_name: clean(r['Product Name']),
      variation: clean(r['Variation']),
      quantity,
      sku_unit_original_price: clean(r['SKU Unit Original Price']),
      sku_subtotal_after_discount: clean(r['SKU Subtotal After Discount']),
      shipping_fee_after_discount: clean(r['Shipping Fee After Discount']),
      order_amount: clean(r['Order Amount']),
      payment_method: clean(r['Payment Method']),
      created_time: parseTikTokDate(r['Created Time']),
      paid_time: parseTikTokDate(r['Paid Time']),
      rts_time: parseTikTokDate(r['RTS Time']),
      shipped_time: parseTikTokDate(r['Shipped Time']),
      delivered_time: parseTikTokDate(r['Delivered Time']),
      tracking_id: clean(r['Tracking ID']),
      shipping_provider_name: clean(r['Shipping Provider Name']),
      buyer_username: clean(r['Buyer Username']),
      recipient: clean(r['Recipient']),
      first_name: clean(r['First name']),
      last_name: clean(r['Last name']),
      country: clean(r['Country']),
      zipcode: clean(r['Zipcode']),
      prefecture: clean(r['Prefecture']),
      county: clean(r['County']),
      city_ward: clean(r['City/Ward']),
      address_line_1: clean(r['Address Line 1']),
      address_line_2: clean(r['Address Line 2']),
      phone: clean(r['Phone #']),
      product_category: clean(r['Product Category']),
      package_id: clean(r['Package ID']),
      seller_note: clean(r['Seller Note']),
      buyer_message: clean(r['Buyer Message']),
    });
  }

  return { rows, errors };
}

/** Seller SKU からシステム内プラン名を推定 */
export function guessMenuSet(sellerSku: string | null | undefined, productName?: string | null): string {
  const sku = (sellerSku || '').toUpperCase();
  if (sku.includes('TRIAL6') || sku.includes('TRIAL-6')) return 'お試し6個セット';
  if (sku.includes('MONTHLY-12') || sku.includes('SUB-12')) return 'ふとるめし12食 月額プラン';
  return productName || sku || 'TikTok注文';
}
