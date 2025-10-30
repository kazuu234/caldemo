// 日本の主要都市データ（オフ会用）

export interface JapanCity {
  name: string;
  region: string;
  emoji: string;
}

export const JAPAN_CITIES: JapanCity[] = [
  // 北海道・東北
  { name: '札幌', region: '北海道・東北', emoji: '🏔️' },
  { name: '仙台', region: '北海道・東北', emoji: '🌲' },
  { name: '函館', region: '北海道・東北', emoji: '🦑' },
  { name: '旭川', region: '北海道・東北', emoji: '❄️' },
  { name: '青森', region: '北海道・東北', emoji: '🍎' },
  { name: '盛岡', region: '北海道・東北', emoji: '🏯' },
  { name: '秋田', region: '北海道・東北', emoji: '🌾' },
  { name: '山形', region: '北海道・東北', emoji: '🍒' },
  { name: '福島', region: '北海道・東北', emoji: '🍑' },
  
  // 関東
  { name: '東京', region: '関東', emoji: '🗼' },
  { name: '横浜', region: '関東', emoji: '⚓' },
  { name: '川崎', region: '関東', emoji: '🏭' },
  { name: 'さいたま', region: '関東', emoji: '🏟️' },
  { name: '千葉', region: '関東', emoji: '🌊' },
  { name: '水戸', region: '関東', emoji: '🌸' },
  { name: '宇都宮', region: '関東', emoji: '🥟' },
  { name: '前橋', region: '関東', emoji: '⛰️' },
  { name: '横須賀', region: '関東', emoji: '⚓' },
  { name: '鎌倉', region: '関東', emoji: '⛩️' },
  
  // 中部
  { name: '名古屋', region: '中部', emoji: '🏰' },
  { name: '静岡', region: '中部', emoji: '🗻' },
  { name: '浜松', region: '中部', emoji: '🎹' },
  { name: '新潟', region: '中部', emoji: '🍚' },
  { name: '金沢', region: '中部', emoji: '🦀' },
  { name: '富山', region: '中部', emoji: '⛰️' },
  { name: '福井', region: '中部', emoji: '🦕' },
  { name: '長野', region: '中部', emoji: '🏔️' },
  { name: '岐阜', region: '中部', emoji: '🏯' },
  { name: '甲府', region: '中部', emoji: '🍇' },
  
  // 関西
  { name: '大阪', region: '関西', emoji: '🏯' },
  { name: '京都', region: '関西', emoji: '⛩️' },
  { name: '神戸', region: '関西', emoji: '🌉' },
  { name: '奈良', region: '関西', emoji: '🦌' },
  { name: '大津', region: '関西', emoji: '🏞️' },
  { name: '和歌山', region: '関西', emoji: '🍊' },
  
  // 中国・四国
  { name: '広島', region: '中国・四国', emoji: '🏯' },
  { name: '岡山', region: '中国・四国', emoji: '🍑' },
  { name: '山口', region: '中国・四国', emoji: '🌉' },
  { name: '鳥取', region: '中国・四国', emoji: '🏜️' },
  { name: '松江', region: '中国・四国', emoji: '🏯' },
  { name: '高松', region: '中国・四国', emoji: '🍜' },
  { name: '松山', region: '中国・四国', emoji: '🏰' },
  { name: '高知', region: '中国・四国', emoji: '🐟' },
  { name: '徳島', region: '中国・四国', emoji: '🌀' },
  
  // 九州・沖縄
  { name: '福岡', region: '九州・沖縄', emoji: '🍜' },
  { name: '北九州', region: '九州・沖縄', emoji: '🌉' },
  { name: '熊本', region: '九州・沖縄', emoji: '🏯' },
  { name: '鹿児島', region: '九州・沖縄', emoji: '🌋' },
  { name: '長崎', region: '九州・沖縄', emoji: '⛪' },
  { name: '佐賀', region: '九州・沖縄', emoji: '🍵' },
  { name: '大分', region: '九州・沖縄', emoji: '♨️' },
  { name: '宮崎', region: '九州・沖縄', emoji: '🌴' },
  { name: '那覇', region: '九州・沖縄', emoji: '🏝️' },
];

export const JAPAN_CITIES_BY_REGION = JAPAN_CITIES.reduce((acc, city) => {
  if (!acc[city.region]) {
    acc[city.region] = [];
  }
  acc[city.region].push(city);
  return acc;
}, {} as Record<string, JapanCity[]>);

export const JAPAN_REGIONS = Object.keys(JAPAN_CITIES_BY_REGION);
