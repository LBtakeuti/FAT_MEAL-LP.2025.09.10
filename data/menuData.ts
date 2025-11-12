export interface MenuItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  price: number;
  image: string;
  description: string;
  features: string[];
  ingredients: string[];
  allergens: string[];
}

export const menuItems: MenuItem[] = [
  {
    id: 'karaage-sake',
    name: '唐揚げ＆鮭塩焼き弁当',
    calories: 1430,
    protein: 79,
    fat: 45,
    carbs: 120,
    price: 1290,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
    description: 'ジューシーな唐揚げと塩焼き鮭の豪華な組み合わせ。おかずだけでボリューム満点460g、タンパク質79gの高栄養弁当。',
    features: [
      '高タンパク質79g',
      'おかずボリューム460g',
      '和風副菜付き',
      'カロリー1430kcal'
    ],
    ingredients: [
      '鶏の唐揚げ200g',
      '鮭塩焼き120g',
      'ほうれん草胡麻和え60g',
      '厚焼き玉子80g'
    ],
    allergens: [
      '小麦',
      '卵',
      '大豆',
      '鶏肉',
      'さけ',
      'ごま'
    ]
  },
  {
    id: 'hamburg-chicken',
    name: 'ハンバーグ＆チキンステーキ弁当',
    calories: 1550,
    protein: 92,
    fat: 52,
    carbs: 115,
    price: 1390,
    image: 'https://images.unsplash.com/photo-1564671165093-20688ff1fffa?w=800&q=80',
    description: 'ジューシーなハンバーグと鶏むね肉ステーキのWメイン。おかずだけで560gの大ボリューム、タンパク質92gの最強弁当。',
    features: [
      '超高タンパク質92g',
      'Wメイン構成',
      'おかずボリューム560g',
      'カロリー1550kcal'
    ],
    ingredients: [
      'ハンバーグ（合挽き）180g',
      '鶏むね肉ステーキ200g',
      'マッシュポテト100g',
      'ブロッコリーソテー80g'
    ],
    allergens: [
      '小麦',
      '卵',
      '乳',
      '大豆',
      '牛肉',
      '豚肉',
      '鶏肉'
    ]
  },
  {
    id: 'hoikoro-yurinchi',
    name: '回鍋肉＆油淋鶏弁当',
    calories: 1670,
    protein: 88,
    fat: 58,
    carbs: 125,
    price: 1420,
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80',
    description: '本格中華の回鍋肉と油淋鶏のボリューム満点弁当。おかずだけで480gの食べ応え、カロリー1670kcalの最強メニュー。',
    features: [
      '最高カロリー1670kcal',
      '本格中華料理',
      '高タンパク質88g',
      'おかずボリューム480g'
    ],
    ingredients: [
      '回鍋肉（豚肉200g）',
      '油淋鶏200g',
      '春雨サラダ80g'
    ],
    allergens: [
      '小麦',
      '大豆',
      '豚肉',
      '鶏肉',
      'ごま油'
    ]
  }
];

export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItems.find(item => item.id === id);
}