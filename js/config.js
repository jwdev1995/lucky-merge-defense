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
};

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
  archer:   { id:'archer',   name:'궁수',     rarity:'common', icon:'🏹', dmg:6,  rate:1.2, range:2.4, type:'single', desc:'기본 원거리 공격' },
  sword:    { id:'sword',    name:'검병',     rarity:'common', icon:'⚔️', dmg:11, rate:0.8, range:1.6, type:'single', desc:'근접 강타' },
  spear:    { id:'spear',    name:'창병',     rarity:'common', icon:'🔱', dmg:7,  rate:0.9, range:2.0, type:'pierce', pierce:2, desc:'직선 관통(2체)' },
  slime:    { id:'slime',    name:'슬라임',   rarity:'common', icon:'🟢', dmg:4,  rate:1.0, range:1.8, type:'splash', radius:0.6, desc:'작은 광역 튀김' },
  farmer:   { id:'farmer',   name:'농부',     rarity:'common', icon:'🌾', dmg:5,  rate:1.5, range:2.0, type:'single', desc:'빠른 낫질' },
  // 희귀
  mage:     { id:'mage',     name:'마법사',   rarity:'rare', icon:'🔮', dmg:14, rate:0.8, range:2.6, type:'splash', radius:0.9, desc:'광역 마법탄' },
  hunter:   { id:'hunter',   name:'사냥꾼',   rarity:'rare', icon:'🎯', dmg:9,  rate:2.2, range:2.8, type:'single', desc:'고속 연사' },
  frost:    { id:'frost',    name:'얼음술사', rarity:'rare', icon:'❄️', dmg:12, rate:0.9, range:2.5, type:'slow', slow:0.4, slowDur:2, desc:'둔화 40% (2초)' },
  crossbow: { id:'crossbow', name:'석궁병',   rarity:'rare', icon:'🪃', dmg:16, rate:0.9, range:2.8, type:'pierce', pierce:3, desc:'관통(3체)' },
  rogue:    { id:'rogue',    name:'도적',     rarity:'rare', icon:'🔪', dmg:15, rate:1.3, range:1.8, type:'single', crit:0.3, desc:'치명타 30%' },
  // 영웅
  pyro:     { id:'pyro',     name:'화염술사', rarity:'epic', icon:'🔥', dmg:30, rate:0.8, range:2.6, type:'burn', radius:1.0, dot:10, dotDur:3, desc:'광역 + 화상(초당 10, 3초)' },
  sniper:   { id:'sniper',   name:'저격수',   rarity:'epic', icon:'🔭', dmg:120, rate:0.35, range:5.0, type:'single', crit:0.2, desc:'초장거리 고화력' },
  storm:    { id:'storm',    name:'번개술사', rarity:'epic', icon:'⚡', dmg:34, rate:1.0, range:2.8, type:'chain', chain:3, desc:'연쇄 번개(3체)' },
  assassin: { id:'assassin', name:'암살자',   rarity:'epic', icon:'🥷', dmg:40, rate:1.4, range:2.0, type:'single', crit:0.5, desc:'치명타 50%' },
  viper:    { id:'viper',    name:'독사',     rarity:'epic', icon:'🐍', dmg:22, rate:1.2, range:2.4, type:'poison', dot:14, dotDur:4, desc:'중독(초당 14, 4초)' },
  // 전설
  dragonknight:{ id:'dragonknight', name:'드래곤 기사', rarity:'legend', icon:'🐲', dmg:150, rate:0.8, range:2.8, type:'splash', radius:1.4, desc:'대광역 브레스' },
  archmage: { id:'archmage', name:'대마법사', rarity:'legend', icon:'🧙', dmg:260, rate:0.6, range:3.2, type:'splash', radius:1.2, desc:'광역 폭발' },
  divinearcher:{ id:'divinearcher', name:'신궁', rarity:'legend', icon:'🌠', dmg:70, rate:3.0, range:3.4, type:'single', crit:0.25, desc:'초연사 + 치명타' },
  chrono:   { id:'chrono',   name:'시간술사', rarity:'legend', icon:'⏳', dmg:140, rate:0.7, range:3.0, type:'slow', radius:1.2, slow:0.5, slowDur:2.5, desc:'광역 둔화 50%' },
  // 신화
  phoenix:  { id:'phoenix',  name:'불사조',   rarity:'mythic', icon:'🦅', dmg:700, rate:1.0, range:3.4, type:'burn', radius:1.6, dot:120, dotDur:4, chain:3, desc:'대광역 화상 + 연쇄' },
  chaoslord:{ id:'chaoslord', name:'혼돈의 군주', rarity:'mythic', icon:'👁️', dmg:900, rate:0.9, range:3.0, type:'splash', radius:1.3, crit:0.6, desc:'초고치명타 광역' },
  archangel:{ id:'archangel', name:'천사장',  rarity:'mythic', icon:'👼', dmg:380, rate:2.5, range:6.0, type:'slow', slow:0.35, slowDur:2, desc:'초장거리 연사 + 둔화' },
  worldtree:{ id:'worldtree', name:'세계수',  rarity:'mythic', icon:'🌳', dmg:500, rate:0.8, range:4.0, type:'poison', radius:2.2, dot:150, dotDur:5, slow:0.3, slowDur:3, desc:'광역 중독 + 둔화' },
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
  { round: 10, name:'오우거 군주', icon:'👹', sprite:'ogre', hp:600 },
  { round: 20, name:'흑룡',       icon:'🐉', sprite:'blackdragon', hp:4500 },
  { round: 30, name:'리치 킹',    icon:'💀', sprite:'lich', hp:30000 },
  { round: 40, name:'마왕',       icon:'👑', sprite:'demonking', hp:95000 },
];

export const WAVE = {
  hpGrowth: 1.2,
  count: (r) => Math.min(40, 12 + r),
  // 라운드별 구성 비율
  mix: (r) => r < 5 ? { normal: 1 } : r < 12 ? { normal: 0.75, fast: 0.25 } : { normal: 0.6, fast: 0.25, shield: 0.15 },
};

export const SPEEDS = [1, 2, 3];
