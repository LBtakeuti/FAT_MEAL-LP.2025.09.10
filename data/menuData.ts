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
    id: 'yakiniku',
    name: '甘辛焼肉',
    calories: 820,
    protein: 38,
    fat: 42,
    carbs: 68,
    price: 880,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
    description: '特製の甘辛タレで味付けした国産牛肉をたっぷり使用。白米との相性抜群で、がっつり食べたい方におすすめの一品です。',
    features: [
      '国産牛肉100%使用',
      '秘伝の甘辛タレで味付け',
      'ボリューム満点の250g',
      '野菜もバランスよく配合'
    ],
    ingredients: [
      '牛肉（国産）',
      '玉ねぎ',
      'にんじん',
      'ピーマン',
      '醤油',
      '砂糖',
      'みりん',
      '酒',
      'にんにく',
      '生姜',
      'ごま油',
      '片栗粉'
    ],
    allergens: [
      '小麦',
      '大豆',
      'ごま',
      '牛肉'
    ]
  },
  {
    id: 'karaage',
    name: 'ジューシー唐揚げ',
    calories: 780,
    protein: 35,
    fat: 38,
    carbs: 65,
    price: 750,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
    description: '外はカリッと、中はジューシーな特大唐揚げ。独自の下味と二度揚げ製法で、冷めても美味しさが持続します。',
    features: [
      '国産鶏もも肉使用',
      '特製スパイスブレンド',
      '二度揚げでカリカリ食感',
      '1個あたり約50gの特大サイズ'
    ],
    ingredients: [
      '鶏もも肉（国産）',
      '小麦粉',
      '片栗粉',
      '卵',
      '醤油',
      '酒',
      'にんにく',
      '生姜',
      '塩',
      'こしょう',
      '植物油'
    ],
    allergens: [
      '小麦',
      '卵',
      '大豆',
      '鶏肉'
    ]
  },
  {
    id: 'kakuni',
    name: 'とろける角煮',
    calories: 850,
    protein: 32,
    fat: 45,
    carbs: 70,
    price: 920,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    description: 'じっくり煮込んだ豚バラ肉の角煮。箸で切れるほど柔らかく、甘辛い味付けがご飯を進めます。',
    features: [
      '国産豚バラ肉使用',
      '6時間以上の低温調理',
      'コラーゲンたっぷり',
      '大根と卵付き'
    ],
    ingredients: [
      '豚バラ肉（国産）',
      '大根',
      'ゆで卵',
      '醤油',
      '砂糖',
      'みりん',
      '酒',
      '生姜',
      'ネギ',
      '八角',
      '昆布だし'
    ],
    allergens: [
      '小麦',
      '卵',
      '大豆',
      '豚肉'
    ]
  },
  {
    id: 'mapo',
    name: 'お肉ゴロゴロ麻婆豆腐',
    calories: 720,
    protein: 30,
    fat: 35,
    carbs: 62,
    price: 780,
    image: 'https://images.unsplash.com/photo-1617692855027-33b14f061079?w=800&q=80',
    description: '大きめにカットした豚ひき肉と豆腐がゴロゴロ入った本格麻婆豆腐。程よい辛さとコクのある味わいです。',
    features: [
      '豚ひき肉たっぷり150g',
      '本場四川の豆板醤使用',
      '絹ごし豆腐でなめらか食感',
      '花椒の香り豊か'
    ],
    ingredients: [
      '豚ひき肉',
      '絹ごし豆腐',
      '豆板醤',
      '甜麺醤',
      'にんにく',
      '生姜',
      'ネギ',
      '醤油',
      '鶏がらスープ',
      '片栗粉',
      'ごま油',
      '花椒'
    ],
    allergens: [
      '小麦',
      '大豆',
      '豚肉',
      'ごま'
    ]
  },
  {
    id: 'saba',
    name: '特大鯖の味噌煮',
    calories: 680,
    protein: 28,
    fat: 32,
    carbs: 58,
    price: 850,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    description: '脂の乗った特大サイズの鯖を、特製味噌だれでじっくり煮込みました。DHAやEPAなど健康に良い成分もたっぷり。',
    features: [
      'ノルウェー産特大サバ使用',
      '1切れ150g以上',
      'DHA・EPA豊富',
      '骨まで柔らかく調理'
    ],
    ingredients: [
      'さば（ノルウェー産）',
      '味噌',
      '砂糖',
      'みりん',
      '酒',
      '生姜',
      'ネギ',
      '昆布だし'
    ],
    allergens: [
      '大豆',
      'さば'
    ]
  }
];

export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItems.find(item => item.id === id);
}