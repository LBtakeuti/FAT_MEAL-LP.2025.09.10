import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postalCode = searchParams.get('postalCode');

  if (!postalCode) {
    return NextResponse.json(
      { error: '郵便番号が指定されていません' },
      { status: 400 }
    );
  }

  // ハイフンを除去して7桁の数字のみにする
  const cleanPostalCode = postalCode.replace(/-/g, '');

  if (cleanPostalCode.length !== 7 || !/^\d{7}$/.test(cleanPostalCode)) {
    return NextResponse.json(
      { error: '正しい郵便番号を入力してください' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanPostalCode}`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return NextResponse.json({
        prefecture: result.address1,
        city: result.address2 + result.address3,
      });
    } else {
      return NextResponse.json(
        { error: '住所が見つかりませんでした' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('住所検索エラー:', error);
    return NextResponse.json(
      { error: '住所の検索に失敗しました' },
      { status: 500 }
    );
  }
}
