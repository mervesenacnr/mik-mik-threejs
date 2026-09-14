export const COLORS = {
  cream: '#f5eddb',
  ink: '#173b3c',
  teal: '#33776b',
  mint: '#99bea4',
  coral: '#d78064',
  gold: '#e9ba61',
  red: '#d75e54',
  purple: '#a692cc',
};
export const MAP = { minX: -32, maxX: 32, minZ: -24, maxZ: 28 };
export const TABLES = [
  [-8, -1],
  [8, -1],
  [-8, 8],
  [8, 8],
  [-18, 0],
  [18, 0],
  [-18, 13],
  [18, 13],
  [-7, 20],
  [7, 20],
];
export const FURS = [
  ['Kül', '#999a9f'],
  ['Bisküvi', '#bc9873'],
  ['Krem', '#e0d1b5'],
  ['Kakao', '#79635d'],
];
export const CLOTHS = [
  ['Kiremit', '#cc735b'],
  ['Adaçayı', '#6e9988'],
  ['Gece', '#526783'],
  ['Mürdüm', '#896680'],
];
export const EYES = [
  ['round', 'Yuvarlak'],
  ['sharp', 'Keskin'],
  ['sleepy', 'Uykulu'],
  ['oval', 'Oval'],
];
export const CHARACTERS = [
  { id: 'mik', name: 'Mik', role: 'Usta şef', detail: 'Dengeli başlangıç.', unlock: '' },
  { id: 'zip', name: 'Zıp', role: 'Hızlı kurye', detail: '+%15 hız · +1 tabak', unlock: 'service' },
  {
    id: 'tok',
    name: 'Tok',
    role: 'Mutfak muhafızı',
    detail: '+24 can · +%15 hasar · −%8 hız',
    unlock: 'hunter',
  },
  {
    id: 'nane',
    name: 'Nane',
    role: 'Bahçenin şefi',
    detail: '+%25 pişirme · +%20 temizlik',
    unlock: 'host',
  },
];
export const COSTUMES = [
  ['chef', 'Şef', ''],
  ['scarf', 'Gezgin', 'service'],
  ['armor', 'Muhafız', 'hunter'],
  ['royal', 'Kraliyet', 'victory'],
];
export const ACHIEVEMENTS = [
  ['service', 'İlk müdavimler', 'served', 10, 'Zıp + Gezgin kıyafeti'],
  ['hunter', 'Mutfak muhafızı', 'kills', 75, 'Tok + Muhafız kıyafeti'],
  ['host', 'Evin lezzeti', 'served', 50, 'Nane'],
  ['survivor', 'Akşam mesaisi', 'wave', 4, '20 kalıcı bahşiş'],
  ['victory', 'Usta şef', 'wins', 1, 'Kraliyet + Kâbus'],
  ['hard_win', 'Demir mutfak', 'hard_wins', 1, '50 kalıcı bahşiş'],
];
export const TRAINING = [
  ['health', 'Dayanıklılık', '+8 can'],
  ['speed', 'Çeviklik', '+%3 hız'],
  ['damage', 'Kuvvet', '+%5 silah hasarı'],
  ['cook', 'Mutfak eğitimi', '+%5 pişirme'],
  ['clean', 'Temizlik eğitimi', '+%5 temizlik'],
];
export const DIFFICULTIES = [
  ['Öğle', 1, 1, 1, 0],
  ['Yoğun mesai', 1.35, 1.25, 1.15, 2],
  ['Kâbus', 1.8, 1.6, 1.3, 4],
];
export const DISHES = ['Peynir burger', 'Sebzeli pizza', 'Balkabağı çorbası', 'Peynir tabağı'];
export const SPECIES = [
  'Sokak kedisi',
  'Sokak köpeği',
  'Kara kedi',
  'Zırhlı buldog',
  'Kızıl tilki',
  'Sopalı insan',
];
export const POOLS = [
  [0],
  [0, 1, 1],
  [0, 0, 2, 2, 1, 1, 1, 1, 5],
  [0, 2, 2, 2, 1, 1, 3, 3, 5],
  [2, 2, 2, 1, 3, 3, 3, 4, 4, 5],
  [2, 2, 2, 1, 3, 3, 3, 4, 4, 5],
];
export const SINGLE = new Set([
  'robot',
  'belt',
  'vip',
  'student',
  'regular',
  'boulevard',
  'express',
  'portal',
]);
export const EVOLUTIONS = { robot: 'clean', belt: 'capacity' };
export const PERKS = [
  {
    id: 'clean',
    source: 'kitchen',
    name: 'Köpük ustası',
    description: 'Temizlik +%35 hızlı.\nIV: Bulaşık perisi evrimi açılır.',
  },
  {
    id: 'speed',
    source: 'kitchen',
    name: 'Minik turbo',
    description: 'Hareket hızı +%18.\nDaha çok masa, daha az telaş.',
  },
  {
    id: 'range',
    source: 'kitchen',
    name: 'Uzun patiler',
    description: 'Otomatik işlem alanı +0,6 m.\nİki masaya birden yetiş.',
  },
  {
    id: 'capacity',
    source: 'kitchen',
    name: 'Denge ustası',
    description: 'Tepsi kapasitesi +1 tabak.\nIV: Servis bandı evrimi açılır.',
  },
  {
    id: 'dash',
    source: 'kitchen',
    name: 'Peynir gibi kay',
    description: 'Dash beklemesi −%25.\nDash boyunca hareket hızı artar.',
  },
  {
    id: 'hands',
    source: 'kitchen',
    name: 'Seri patiler',
    description: 'Sipariş alma +%30 hızlı.\nYaklaş; gerisini Mik halleder.',
  },
  {
    id: 'oven',
    source: 'kitchen',
    name: 'Taş fırın',
    description: 'Yemekler +%30 hızlı pişer.\nMutfak tüm siparişleri otomatik hazırlar.',
  },
  {
    id: 'robot',
    source: 'kitchen',
    name: 'Bulaşık perisi',
    description: 'Kirli masalar 7 saniyede\nkendiliğinden temizlenir.',
  },
  {
    id: 'belt',
    source: 'kitchen',
    name: 'Servis bandı',
    description: 'Hazır tabaklar uzaktan\notomatik olarak tepsine gelir.',
  },
  {
    id: 'decor',
    source: 'kitchen',
    name: 'Sıcacık bir köşe',
    description: 'Tüm müşterilerin sabrı +%25.\nRestorana çiçekler eklenir.',
  },
  {
    id: 'vip',
    source: 'kitchen',
    name: 'Gurme kulübü',
    description: 'Altın ceketli gurmeler açılır.\nDaha az sabır, 3 kat bahşiş.',
  },
  {
    id: 'student',
    source: 'kitchen',
    name: 'Kampüs müdavimi',
    description: 'Öğrenciler açılır: +%70 sabır,\n%50 daha fazla deneyim.',
  },
  {
    id: 'regular',
    source: 'kitchen',
    name: 'Mahallenin favorisi',
    description: 'Müdavimler açılır.\nDaha hızlı yer, itibarı onarır.',
  },
  {
    id: 'tips',
    source: 'kitchen',
    name: 'Tadına doyamadık',
    description: 'Her servisten +%30 bahşiş.\nBütün müşteri türlerine uygulanır.',
  },
  {
    id: 'boulevard',
    source: 'kitchen',
    name: 'Açık bulvar',
    description: 'Orta bölmeler kalkar.\nRestoranda doğrudan rota açılır.',
  },
  {
    id: 'express',
    source: 'kitchen',
    name: 'Ekspres hat',
    description: 'Orta koridora hız şeridi: +%45 hız.\nMutfak ile salon arasında ak.',
  },
  {
    id: 'portal',
    source: 'kitchen',
    name: 'Fare tünelleri',
    description: 'İki yandaki tüneller arasında\nyürüyerek anında geçiş yap.',
  },
  {
    id: 'pressure',
    source: 'combat',
    name: 'Soda basıncı',
    description: 'Otomatik soda atışı +%30 hasar.\nYakındaki canavarları püskürt.',
  },
  {
    id: 'reload',
    source: 'combat',
    name: 'Seri soda',
    description: 'Otomatik atış hızı +%25.\nServis yaparken savaşmaya devam et.',
  },
  {
    id: 'bell',
    source: 'combat',
    name: 'Savunma zili',
    description: 'Her serviste yakındaki canavarlara\nhasar veren bir zil çalar.',
  },
  {
    id: 'knife',
    source: 'combat',
    name: 'Şef bıçakları',
    description: 'Otomatik, delici bıçaklar açılır.\nHer seviye hasarı ve bıçak sayısını artırır.',
  },
  {
    id: 'pan',
    source: 'combat',
    name: 'Dönen tavalar',
    description: 'Çevrende dönen tavalar açılır.\nYaklaşan canavarlara temas hasarı.',
  },
  {
    id: 'pepper',
    source: 'combat',
    name: 'Acı biber bulutu',
    description: 'Ardında hasarlı biber bulutları bırak.\nKedi ve köpekleri yavaşlatır.',
  },
  {
    id: 'reach',
    source: 'combat',
    name: 'Usta menzili',
    description: 'Otomatik silah menzili +2 metre.\nBıçaklar daha uzağa ulaşır.',
  },
  {
    id: 'might',
    source: 'combat',
    name: 'Döküm ustası',
    description: 'Bütün silahların hasarı +%25.\nSoda, bıçak, tava ve biber güçlenir.',
  },
];
