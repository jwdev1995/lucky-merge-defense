// 밸런스 단일 소스. 모든 수치는 여기서만 수정한다.
export const BOARD = { cols: 8, rows: 5, gridCols: 6, gridRows: 3, gridX: 1, gridY: 1 };

export const RULES = {
  startGold: 120,
  summonCost: 20,
  rouletteCost: 30,
  unitCap: 20,
  stackMax: 3,
  enemyLimit: 100,
  roundTime: 20,
  maxRound: 40,
  bossEvery: 10,
  spawnWindow: 10,       // 라운드 시작 후 몇 초 동안 분산 스폰
  roundBonusBase: 15,    // + round
  bossGoldBase: 100,     // + round*5
  enemySpeed: 1.1,       // cell/s
  critMult: 2.5,
  shieldReduce: 0.2,
  elementAdv: 1.3,       // 상성 유리 피해 배율
  elementDis: 0.9,       // 상성 불리 피해 배율
  coopLimitMult: 1.6,    // 2인 협동 시 몬스터 한도 배율 (100 → 160, 두 보드 합산)
  coopBossHpMult: 0.8,   // 2인 협동 시 보드별 보스 체력 배율 (둘 다 잡아야 하므로 완화)
  giftGold: 20,          // 협동 골드 지원 단위
};

// 속성 상성: beats 대상에게 유리. 빛↔어둠은 서로 유리. color = 배지/UI, eye = 스프라이트 눈·허리띠(진한 변형)
export const ELEMENTS = {
  fire:    { name:'불',   short:'불', color:'#ff6b3d', eye:'#ff5a2a', beats:'wind' },
  wind:    { name:'바람', short:'풍', color:'#7ee8c9', eye:'#2fbf96', beats:'earth' },
  earth:   { name:'땅',   short:'땅', color:'#c9924a', eye:'#a86f2a', beats:'thunder' },
  thunder: { name:'번개', short:'뇌', color:'#ffe84a', eye:'#e0b400', beats:'water' },
  water:   { name:'물',   short:'물', color:'#4ea8ff', eye:'#2f86e6', beats:'fire' },
  light:   { name:'빛',   short:'빛', color:'#fff1b8', eye:'#f0a63a', beats:'dark' },
  dark:    { name:'어둠', short:'암', color:'#9b6bff', eye:'#7a3fe0', beats:'light' },
};
export const ELEMENT_ORDER = ['fire', 'water', 'wind', 'earth', 'thunder', 'light', 'dark'];
// 속성 스킬: 유닛의 주 대상 타격마다 chance 확률로 발동. 보스에게는 스턴·속박·밀치기 효과가 BOSS_CC_MULT 배.
export const ELEMENT_SKILLS = {
  fire:    { name:'화상',   chance:0.25, desc:'2초간 초당 공격력 30%의 추가 피해', dur:2, dotPct:0.3 },
  water:   { name:'둔화',   chance:0.25, desc:'2초간 이동속도 40% 감소', dur:2, slow:0.4 },
  wind:    { name:'밀치기', chance:0.2,  desc:'경로 뒤쪽으로 0.7칸 밀어냄', push:0.7 },
  earth:   { name:'속박',   chance:0.2,  desc:'1초간 이동 불가', dur:1.0 },
  thunder: { name:'감전',   chance:0.2,  desc:'0.5초 스턴 + 인접 1체에 피해 50% 전이', dur:0.5, jump:0.5 },
  light:   { name:'성광',   chance:0.2,  desc:'즉시 공격력 60%의 추가 피해', bonus:0.6 },
  dark:    { name:'저주',   chance:0.2,  desc:'3초간 받는 피해 +25%', dur:3, amp:0.25 },
};
export const BOSS_CC_MULT = 0.3;
export function elementMult(atk, def) {
  if (!atk || !def || atk === def) return 1;
  if (ELEMENTS[atk].beats === def) return RULES.elementAdv;
  if (ELEMENTS[def].beats === atk) return RULES.elementDis;
  return 1;
}

export const RARITY = ['common', 'rare', 'epic', 'legend', 'mythic'];
export const RARITY_INFO = {
  common: { name: '일반', color: '#9aa3b2', sell: 10, upCost: 30 },
  rare:   { name: '희귀', color: '#4ea8ff', sell: 25, upCost: 60 },
  epic:   { name: '영웅', color: '#b56cff', sell: 60, upCost: 120 },
  legend: { name: '전설', color: '#ff9f43', sell: 150, upCost: 250 },
  mythic: { name: '신화', color: '#ff4d6d', sell: 300, upCost: 400 },
};
export const UPGRADE = { perLevel: 0.15, costGrowth: 1.5, maxLevel: 10 };

// 소환 확률 (합 100)
export const SUMMON_ODDS = { common: 68, rare: 24, epic: 7, legend: 1 };

// 룰렛 (합 100)
export const ROULETTE = [
  { type: 'gold', value: 10, weight: 35, label: '10 골드' },
  { type: 'gold', value: 60, weight: 10, label: '60 골드' },
  { type: 'unit', rarity: 'rare', weight: 28, label: '희귀 유닛' },
  { type: 'unit', rarity: 'epic', weight: 17, label: '영웅 유닛' },
  { type: 'unit', rarity: 'legend', weight: 5, label: '전설 유닛' },
  { type: 'none', weight: 5, label: '꽝…' },
];

// 공격 타입: single | splash | chain | pierce | slow | poison | burn
// dmg: 1회 피해, rate: 초당 공격 횟수, range: 셀 단위 사거리
export const UNITS = {
  // 일반
  archer:   { id:'archer',   name:'궁수',     rarity:'common', element:'wind', icon:'🏹', dmg:6,  rate:1.2, range:2.4, type:'single', desc:'기본 원거리 공격' },
  sword:    { id:'sword',    name:'검병',     rarity:'common', element:'fire', icon:'⚔️', dmg:11, rate:0.8, range:1.6, type:'single', desc:'근접 강타' },
  spear:    { id:'spear',    name:'창병',     rarity:'common', element:'water', icon:'🔱', dmg:7,  rate:0.9, range:2.0, type:'pierce', pierce:2, desc:'직선 관통(2체)' },
  slime:    { id:'slime',    name:'슬라임',   rarity:'common', element:'water', icon:'🟢', dmg:4,  rate:1.0, range:1.8, type:'splash', radius:0.6, desc:'작은 광역 튀김' },
  farmer:   { id:'farmer',   name:'농부',     rarity:'common', element:'earth', icon:'🌾', dmg:5,  rate:1.5, range:2.0, type:'single', desc:'빠른 낫질' },
  // 희귀
  mage:     { id:'mage',     name:'마법사',   rarity:'rare', element:'thunder', icon:'🔮', dmg:14, rate:0.8, range:2.6, type:'splash', radius:0.9, desc:'광역 마법탄' },
  hunter:   { id:'hunter',   name:'사냥꾼',   rarity:'rare', element:'wind', icon:'🎯', dmg:9,  rate:2.2, range:2.8, type:'single', desc:'고속 연사' },
  frost:    { id:'frost',    name:'얼음술사', rarity:'rare', element:'water', icon:'❄️', dmg:12, rate:0.9, range:2.5, type:'slow', slow:0.4, slowDur:2, desc:'둔화 40% (2초)' },
  crossbow: { id:'crossbow', name:'석궁병',   rarity:'rare', element:'earth', icon:'🪃', dmg:16, rate:0.9, range:2.8, type:'pierce', pierce:3, desc:'관통(3체)' },
  rogue:    { id:'rogue',    name:'도적',     rarity:'rare', element:'dark', icon:'🔪', dmg:15, rate:1.3, range:1.8, type:'single', crit:0.3, desc:'치명타 30%' },
  // 영웅
  pyro:     { id:'pyro',     name:'화염술사', rarity:'epic', element:'fire', icon:'🔥', dmg:30, rate:0.8, range:2.6, type:'burn', radius:1.0, dot:10, dotDur:3, desc:'광역 + 화상(초당 10, 3초)' },
  sniper:   { id:'sniper',   name:'저격수',   rarity:'epic', element:'light', icon:'🔭', dmg:120, rate:0.35, range:5.0, type:'single', crit:0.2, desc:'초장거리 고화력' },
  storm:    { id:'storm',    name:'번개술사', rarity:'epic', element:'thunder', icon:'⚡', dmg:34, rate:1.0, range:2.8, type:'chain', chain:3, desc:'연쇄 번개(3체)' },
  assassin: { id:'assassin', name:'암살자',   rarity:'epic', element:'dark', icon:'🥷', dmg:40, rate:1.4, range:2.0, type:'single', crit:0.5, desc:'치명타 50%' },
  viper:    { id:'viper',    name:'독사',     rarity:'epic', element:'earth', icon:'🐍', dmg:22, rate:1.2, range:2.4, type:'poison', dot:14, dotDur:4, desc:'중독(초당 14, 4초)' },
  // 전설
  dragonknight:{ id:'dragonknight', name:'드래곤 기사', rarity:'legend', element:'fire', icon:'🐲', dmg:150, rate:0.8, range:2.8, type:'splash', radius:1.4, desc:'대광역 브레스' },
  archmage: { id:'archmage', name:'대마법사', rarity:'legend', element:'dark', icon:'🧙', dmg:260, rate:0.6, range:3.2, type:'splash', radius:1.2, desc:'광역 폭발' },
  divinearcher:{ id:'divinearcher', name:'신궁', rarity:'legend', element:'light', icon:'🌠', dmg:70, rate:3.0, range:3.4, type:'single', crit:0.25, desc:'초연사 + 치명타' },
  chrono:   { id:'chrono',   name:'시간술사', rarity:'legend', element:'water', icon:'⏳', dmg:140, rate:0.7, range:3.0, type:'slow', radius:1.2, slow:0.5, slowDur:2.5, desc:'광역 둔화 50%' },
  // 신화
  phoenix:  { id:'phoenix',  name:'불사조',   rarity:'mythic', element:'fire', icon:'🦅', dmg:700, rate:1.0, range:3.4, type:'burn', radius:1.6, dot:120, dotDur:4, chain:3, desc:'대광역 화상 + 연쇄' },
  chaoslord:{ id:'chaoslord', name:'혼돈의 군주', rarity:'mythic', element:'dark', icon:'👁️', dmg:900, rate:0.9, range:3.0, type:'splash', radius:1.3, crit:0.6, desc:'초고치명타 광역' },
  archangel:{ id:'archangel', name:'천사장',  rarity:'mythic', element:'light', icon:'👼', dmg:380, rate:2.5, range:6.0, type:'slow', slow:0.35, slowDur:2, desc:'초장거리 연사 + 둔화' },
  worldtree:{ id:'worldtree', name:'세계수',  rarity:'mythic', element:'earth', icon:'🌳', dmg:500, rate:0.8, range:4.0, type:'poison', radius:2.2, dot:150, dotDur:5, slow:0.3, slowDur:3, desc:'광역 중독 + 둔화' },
};

export const RECIPES = [
  { result: 'phoenix',   parts: ['dragonknight', 'pyro', 'storm'] },
  { result: 'chaoslord', parts: ['archmage', 'assassin', 'viper'] },
  { result: 'archangel', parts: ['divinearcher', 'sniper', 'frost'] },
  { result: 'worldtree', parts: ['chrono', 'archmage', 'viper'] },
];

export const ENEMIES = {
  normal: { name:'그렘린', icon:'👾', hp:22, speed:1.0, gold:1, size:0.32 },
  fast:   { name:'늑대',   icon:'🐺', hp:14, speed:1.6, gold:1, size:0.30 },
  shield: { name:'바위골렘', icon:'🪨', hp:50, speed:0.7, gold:2, size:0.38, shield:true },
  boss:   { name:'보스',   icon:'👹', hp:1, speed:0.55, gold:0, size:0.62, boss:true },
};
export const BOSSES = [
  { round: 10, name:'오우거 군주', icon:'👹', sprite:'ogre', element:'earth', hp:600 },
  { round: 20, name:'흑룡',       icon:'🐉', sprite:'blackdragon', element:'fire', hp:4500 },
  { round: 30, name:'리치 킹',    icon:'💀', sprite:'lich', element:'dark', hp:34000 },
  { round: 40, name:'마왕',       icon:'👑', sprite:'demonking', element:'thunder', hp:120000 },
];

export const WAVE = {
  hpGrowth: 1.21,
  count: (r) => Math.min(40, 12 + r),
  // 라운드별 구성 비율
  // 라운드 속성: 7속성 순환 (보스 라운드는 보스 고유 속성)
  element: (r) => ELEMENT_ORDER[(r - 1) % ELEMENT_ORDER.length],
  mix: (r) => r < 5 ? { normal: 1 } : r < 12 ? { normal: 0.75, fast: 0.25 } : { normal: 0.6, fast: 0.25, shield: 0.15 },
};

export const SPEEDS = [1, 2, 3];
