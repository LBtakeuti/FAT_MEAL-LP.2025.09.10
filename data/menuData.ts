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
    id: 'loco-moco',
    name: 'ハンバーグ＆チキンのW弁当',
    calories: 950,
    protein: 65.7,
    fat: 23.0,
    carbs: 0,
    price: 1190,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    description: 'ニチレイグリエハンバーグ120g、目玉焼き、人参30g、ブロッコリー25g、他野菜、デミソース、コンソメ、鶏むね肉120g（オリーブオイル、塩こしょう、ハーブ、スパゲッティ10g）、じゃが芋100g、玉ねぎ50g、えび12g、ホワイトソース22g、コンソメ0.5g、牛乳10g、小松菜50g、ベーコン20g、コーン15g、塩こしょう、油。約950kcal、タンパク質65.7gの栄養満点メニュー。',
    features: [
      'タンパク質65.7g',
      'カロリー950kcal',
      '脂質23.0g',
      '4品構成'
    ],
    ingredients: [
      'ニチレイグリエハンバーグ120g',
      '目玉焼き',
      '人参30g',
      'ブロッコリー25g',
      '他野菜',
      'デミソース',
      'コンソメ',
      '鶏むね肉120g（オリーブオイル、塩こしょう、ハーブ、スパゲッティ10g）',
      'じゃが芋100g',
      '玉ねぎ50g',
      'えび12g',
      'ホワイトソース22g',
      'コンソメ0.5g',
      '牛乳10g',
      '小松菜50g',
      'ベーコン20g',
      'コーン15g',
      '塩こしょう',
      '油'
    ],
    allergens: [
      '小麦',
      '卵',
      '乳',
      '大豆',
      '牛肉',
      '豚肉',
      '鶏肉',
      'えび'
    ]
  },
  {
    id: 'mapo-tofu-chinese',
    name: '麻婆＆酢鶏のダブルW中華弁当',
    calories: 818,
    protein: 72.5,
    fat: 13.0,
    carbs: 0,
    price: 1290,
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
    description: '本格中華4品セット。麻婆豆腐、酢鶏、豆腐入り鶏しゅうまい野菜あんかけ、炒りタマゴ中華風。約818kcal、タンパク質72.5gの健康的な中華弁当。',
    features: [
      'タンパク質72.5g',
      'カロリー818kcal',
      '脂質13.0g',
      '本格中華4品'
    ],
    ingredients: [
      '絹豆腐120g 豚ひき肉60g 長ねぎ20g 甜麺醤豆板醤醤油にんにく油',
      '鶏むね肉150g 玉ねぎ40g 人参40g ピーマン20g 調味料',
      '千代田しゅうまい3個　野菜あん（人参・しいたけ・青梗菜など）',
      '卵1個（約50g）カニ風味かまぼこ20g 長ねぎ10g 鶏ガラスープ醤油ごま油 あん無し'
    ],
    allergens: [
      '小麦',
      '卵',
      '大豆',
      '豚肉',
      '鶏肉',
      'ごま',
      'かに（風味かまぼこ）'
    ]
  },
  {
    id: 'pork-chicken-variety',
    name: '麻婆＆酢鶏のダブルW中華弁当',
    calories: 976,
    protein: 73.5,
    fat: 25.0,
    carbs: 0,
    price: 1390,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    description: '豪華4品セット。豚肉生姜焼き、鶏肉の竜田揚げ、スクランブルエッグ＆ほうれん草ホワイトソース、ナポリタンチーズかけ。約976kcal、タンパク質73.5gのボリューム満点弁当。',
    features: [
      'タンパク質73.5g',
      'カロリー976kcal',
      '脂質25.0g',
      '豪華4品構成'
    ],
    ingredients: [
      '豚もも肉120g 玉ねぎ80g 生姜醤油みりん油',
      '鶏もも肉150g 醤油酒生姜片栗粉',
      '冷凍スクランブル80g ほうれん草30g マッシュルーム16g ホワイトソース コンソメ牛乳',
      'スパゲッティ30g ウインナー25g 玉ねぎ・ピーマン（15g）ケチャップ チーズ3g'
    ],
    allergens: [
      '小麦',
      '卵',
      '乳',
      '大豆',
      '豚肉',
      '鶏肉'
    ]
  }
];

export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItems.find(item => item.id === id);
}