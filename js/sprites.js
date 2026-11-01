// 픽셀 아트 스프라이트 ('.' = 투명). 12x12 (보스 16x16). 오프스크린 캔버스에 렌더링해 캐시한다.
const BASE = { o: '#1b1b2f', W: '#ffffff', k: '#101018', s: '#f6cfa6', r: '#ff5c7a', y: '#ffd166' };

export const PIXEL_ART = {
  // ───────── 일반 ─────────
  archer: { colors: { G: '#4caf6e', D: '#2e7a4a', B: '#8b5a2b', Y: '#c9a24a' }, rows: [
    '....oooo....', '...oGGGGo...', '..oGGGGGGo..', '..oDssssDo..', '..oDsksksDo.', '...ossssso.o',
    '..oGGGGGGoYo', '.oGGBBGGGoYo', '.oGGGGGGGoYo', '..oGGGGGo.o.', '..oBBoBBo...', '..ooo.ooo...' ] },
  sword: { colors: { B: '#4e7fd9', D: '#2c4f9e', M: '#c9d3e6', H: '#8a94a8' }, rows: [
    '....oooo..o.', '...oMMMMo.Wo', '..oMMMMMMoWo', '..oMssssMoWo', '..oMsksksoWo', '...ossssooWo',
    '..oBBBBBBoHo', '.oBBDDBBBoHo', '.oBBBBBBBo.o', '..oBBBBBo...', '..oDDoDDo...', '..ooo.ooo...' ] },
  spear: { colors: { R: '#d9534f', D: '#9e2f2c', M: '#c9d3e6', T: '#8b5a2b' }, rows: [
    '..........Wo', '....oooo..Wo', '...oRRRRo.To', '..oRRRRRRoTo', '..oRssssRoTo', '..oRsksksoTo',
    '...ossssooTo', '..oMMMMMMoTo', '.oMMRRMMMoTo', '.oMMMMMMMo.o', '..oDDoDDo...', '..ooo.ooo...' ] },
  slime: { colors: { G: '#6fe36f', D: '#2f9e4a', L: '#b9ffb9' }, rows: [
    '............', '............', '....oooo....', '..ooGGLLoo..', '.oGGGGGLGGo.', '.oGGGGGGGGo.',
    'oGWkGGGGWkGo', 'oGkkGGGGkkGo', 'oGGGGooGGGGo', 'oGGGGGGGGGGo', '.oDDDDDDDDo.', '..oooooooo..' ] },
  farmer: { colors: { H: '#e3b94d', D: '#a67c1e', B: '#6ca0dc', T: '#8b5a2b' }, rows: [
    '....oooo....', '...oHHHHo...', '.ooHHHHHHoo.', 'oHHHHHHHHHHo', '.ooossssooo.', '..ossksksso.',
    '...ossssso.o', '..oBBBBBBoTo', '.oBBBBBBBoTo', '.oBBBBBBBoTo', '..oDDoDDo.o.', '..ooo.ooo...' ] },
  // ───────── 희귀 ─────────
  mage: { colors: { B: '#4e7fd9', D: '#2c4f9e', Y: '#ffd166', P: '#9db7ff' }, rows: [
    '.....oo.....', '....oBBo....', '...oBBYBo...', '..oBBBBBBo..', '.oBBBBBBBBo.', 'oooossssoooo',
    '..ossksksso.', '...ossssso..', '..oBBBBBBo.o', '.oBBPPBBBoYo', '.oBBBBBBBo.o', '..ooooooo...' ] },
  hunter: { colors: { F: '#e58f3d', D: '#a85a1c', L: '#ffd8a8', T: '#8b5a2b' }, rows: [
    '.o........o.', 'oFo......oFo', 'oFFooooooFFo', 'oFFFFFFFFFFo', '.oFWkFFWkFo.', '.oFFFFFFFFo.',
    '..oFLLLLFo..', '..ooLkkLoo..', '...oLLLLo.oo', '..oFFFFFFoTo', '..oDDoDDo.o.', '..ooo.ooo...' ] },
  frost: { colors: { I: '#9fe8ff', D: '#3fb6e0', L: '#e6fbff' }, rows: [
    '.....oo.....', '....oLLo....', '...oLIILo...', '..oLIIIILo..', '.oIIIIIIIIo.', '.oIWkIIWkIo.',
    '.oIIIIIIIIo.', '..oIIDDIIo..', '.oIIIIIIIIo.', 'oIIoIIIIoIIo', '.oo.oDDo.oo.', '.....oo.....' ] },
  crossbow: { colors: { M: '#aab4c8', D: '#5c6678', B: '#8b5a2b', G: '#3a3f4e' }, rows: [
    '....oooo....', '...oMMMMo...', '..oMMMMMMo..', '..oGssssGo..', '..oGsksksGo.', '...ossssso..',
    '..oMMMMMMo..', '.oMMDDMMMoBo', '.oMMMMMMMBBB', '..oMMMMMo.o.', '..oDDoDDo...', '..ooo.ooo...' ] },
  rogue: { colors: { P: '#6a4fcf', D: '#3b2a7e', K: '#2a2a3e', M: '#d0d4e0' }, rows: [
    '....oooo....', '...oPPPPo...', '..oPPPPPPo..', '..oPPPPPPo..', '..oKWkkWkKo.', '...oKKKKKo..',
    '.MoPPPPPPoM.', 'oMoPPDDPPoMo', '.ooPPPPPPoo.', '..oPPPPPPo..', '..oDDoDDo...', '..ooo.ooo...' ] },
  // ───────── 영웅 ─────────
  pyro: { colors: { F: '#ff7a1a', Y: '#ffd166', R: '#d9342b', D: '#8a1f1a' }, rows: [
    '.....oo.....', '....oFFo.o..', '...oFYYFoFo.', '..oFYYYYFFo.', '..oFYWkYWkFo', '..oFFYYYYFo.',
    '...oFFFFFFo.', '..oRRRRRRo..', '.oRRDDRRRRo.', '.oRRRRRRRRo.', '..oDDoDDo...', '..ooo.ooo...' ] },
  sniper: { colors: { G: '#4f8a3c', D: '#2f5a24', K: '#2a2a3e', M: '#aab4c8' }, rows: [
    '...ooooo....', '..oGGGGGGoo.', '..oGGGGGGGGo', '..oGsskksso.', '..oGsWkWkso.', '...ossssso..',
    '..oGGGGGGoKo', '.oGGDDGGGoKo', '.oGGGGGGKKKK', '..oGGGGGo.Mo', '..oDDoDDo.o.', '..ooo.ooo...' ] },
  storm: { colors: { Y: '#ffe84a', D: '#e0a800', L: '#fff8c4', B: '#2a2a5e' }, rows: [
    '.....oooo...', '....oYYYYo..', '...oYLLYYo..', '..oYYYYYYo..', '..oYWkYWkYo.', '..oYYYYYYYo.',
    '...oYYDDYo..', '..oYYYYYYo..', '.oYYo.oYYYo.', '.oYo...oYYo.', '..o.....oo..', '............' ] },
  assassin: { colors: { K: '#2a2a3e', D: '#15151f', R: '#ff5c7a', M: '#d0d4e0' }, rows: [
    '....oooo....', '...oKKKKo...', '..oKKKKKKo..', '..oKWkKWkKo.', '..oKKKKKKKo.', '...oRRRRRoR.',
    '..oKKKKKKoRo', '.oKKDDKKKKo.', '.oKKKKKKKKo.', 'MooKKKKKKo..', 'M.oDDoDDo...', '..ooo.ooo...' ] },
  viper: { colors: { P: '#9b5de5', D: '#5e2ca5', G: '#c7ff5e', Y: '#ffd166' }, rows: [
    '....oooo....', '...oPPPPo...', '..oPPWkPWko.', '..oPPPPPPPo.', '...oPGGPPo..', '....oPPPPo..',
    '.....oPPPo..', '..ooooPPPo..', '.oPPPPPPPo..', '.oPDDPPPo...', '..oPPPPo....', '...oooo.....' ] },
  // ───────── 전설 ─────────
  dragonknight: { colors: { R: '#e03a3a', D: '#8e1f1f', M: '#c9d3e6', Y: '#ffd166', H: '#ff9f43' }, rows: [
    '.o........o.', 'oRo..oo..oRo', 'oRRooRRooRRo', '.oRRRRRRRRo.', '.oRWkRRWkRo.', '.oRRRRRRRRo.',
    '..oRYYYYRo..', '..oMMMMMMo..', '.oMMHHMMMMo.', '.oMMMMMMMMo.', '..oDDoDDo...', '..ooo.ooo...' ] },
  archmage: { colors: { P: '#9b5de5', D: '#5e2ca5', Y: '#ffd166', B: '#e8e8f0', T: '#8b5a2b' }, rows: [
    '.....oo...Yo', '....oPPo..Yo', '...oPPPPo.To', '..oPPPPPPoTo', '.oPPPPPPPPTo', 'oooossssooTo',
    '..ossksksoTo', '..oBBBBBBoTo', '..oBPPPPBoTo', '.oPPPYYPPPTo', '.oPPPPPPPPo.', '..oooooooo..' ] },
  divinearcher: { colors: { Y: '#ffd166', D: '#c9871b', W: '#fff6d6', L: '#ffe9a8' }, rows: [
    '...yyyyyy...', '..y......y..', '....oooo....', '...oYYYYo..o', '..oYssssYoWo', '..oYsksksoWo',
    '...ossssooWo', '..oLLLLLLoWo', '.oLLYYLLLoWo', '.oLLLLLLLo.o', '..oDDoDDo...', '..ooo.ooo...' ] },
  chrono: { colors: { T: '#5ee3d6', D: '#2a9a8f', S: '#ffd166', L: '#d8fffb' }, rows: [
    '..oooooooo..', '..oTTTTTTo..', '..oLSSSSLo..', '...oLSSLo...', '....oSSo....', '....oLLo....',
    '...oLWkLo...', '..oLLLLLLo..', '..oLLSSLLo..', '..oTSSSSTo..', '..oTTTTTTo..', '..oooooooo..' ] },
  // ───────── 신화 ─────────
  phoenix: { colors: { F: '#ff7a1a', Y: '#ffe066', R: '#e02e2e', W: '#fff6d6' }, rows: [
    '.....oFo....', '....oFYFo...', '...oFYYYFo..', '..oFYWkYFoo.', '.oFFYYYFoYYo', 'oFFooFFFoYYo',
    'oFoFoFFFFYFo', '.ooFFRRFFFo.', '..oFRRRRFo..', '...oRRRRo...', '..oFoFFoFo..', '..o.oooo.o..' ] },
  chaoslord: { colors: { P: '#6a2c9e', D: '#3a1560', R: '#ff3d6b', W: '#ffffff', G: '#c04cff' }, rows: [
    '.o...oo...o.', 'oPo.oPPo.oPo', 'oPPoPPPPoPPo', '.oPPPPPPPPo.', '.oPWWWWWWPo.', 'oPWWRRRRWWPo',
    'oPWRRkkRRWPo', 'oPWWRRRRWWPo', '.oPWWWWWWPo.', '.oGPPPPPPGo.', 'oGo.oDDo.oGo', 'oo...oo...oo' ] },
  archangel: { colors: { W: '#ffffff', L: '#e3ecff', Y: '#ffd166', B: '#9db7ff' }, rows: [
    '...yyyyyy...', '....oooo....', 'W..oYYYYo..W', 'WWoYssssYoWW', 'WWoYsksksoWW', 'WWWossssoWWW',
    'WWoLLLLLLoWW', 'WoLLBBLLLLoW', 'WoLLLLLLLLoW', '.oLLLLLLLLo.', '..oBBoBBo...', '..ooo.ooo...' ] },
  worldtree: { colors: { G: '#4ccf6e', D: '#2a8a45', T: '#8b5a2b', B: '#5a3a1a', P: '#ff9fd0' }, rows: [
    '....oooo....', '..ooGGGGoo..', '.oGGPGGGGGo.', 'oGGGGGGGPGGo', 'oGGWkGGWkGGo', 'oGGGGGGGGGGo',
    '.oGGGooGGGo.', '..ooTTTToo..', '...oTTBTo...', '...oTTTTo...', '..oTTTTTTo..', '..oooooooo..' ] },
  // ───────── 몬스터 ─────────
  normal: { colors: { P: '#b36bff', D: '#6a2fb3', E: '#ff5c7a' }, rows: [
    '.o........o.', 'oPo......oPo', 'oPPoooooooPo', '.oPPPPPPPPo.', '.oPEEPPEEPo.', '.oPPPPPPPPo.',
    '.oPPDDDDPPo.', '.oPPPPPPPPo.', '..oPoPPoPo..', '..oPo..oPo..', '..oo....oo..', '............' ] },
  fast: { colors: { G: '#9aa3b2', D: '#5c6678', E: '#ffd166', W: '#e6e9f0' }, rows: [
    '............', 'o..........o', 'oGo......oGo', 'oGGooooooGGo', '.oGGGGGGGGo.', '.oGEkGGEkGo.',
    '.oGGGGGGGGo.', '..oGWWWWGo..', '..oDGGGGDo..', '..oGoGGoGo..', '..ooooooo...', '............' ] },
  shield: { colors: { S: '#8a8f9e', D: '#555b6b', L: '#b9bfd0', E: '#5ee3d6' }, rows: [
    '....oooo....', '..ooSSSSoo..', '.oSLSSSSSSo.', '.oSSSSSSSSo.', 'oSSEESSEESSo', 'oSSSSSSSSSSo',
    'oSSSDDDDSSSo', 'oLSSSSSSSSSo', '.oSSSSSSSSo.', '.oSSSooSSSo.', '.oDDo..oDDo.', '.oooo..oooo.' ] },
  ogre: { colors: { G: '#7bbf5a', D: '#3f7a2a', T: '#8b5a2b', E: '#ff5c7a', W: '#ffffff' }, rows: [
    '....oooooooo....', '...oGGGGGGGGo...', '..oGGGGGGGGGGo..', '..oGGEEGGGGEEGo.', '..oGGEkGGGGEkGo.', '..oGGGGGGGGGGGo.',
    '..oGGWGGGGGGWGo.', '...oGGDDDDDDGo..', '.ooooGGGGGGGoooo', 'oGGGoTTTTTTTToGo', 'oGGooTTTTTTTTooG', '.oo.oTTTTTTTTo.o',
    '....oTTTTTTTTo..', '....oTTo..oTTo..', '...oDDDo..oDDDo.', '...ooooo..ooooo.' ] },
  blackdragon: { colors: { K: '#3a2f5e', D: '#1e1738', P: '#9b5de5', E: '#ff3d6b', F: '#ff7a1a' }, rows: [
    '.o....oooo....o.', 'oKo..oKKKKo..oKo', 'oKKooKKKKKKooKKo', '.oKKKKKKKKKKKKo.', '.oKKEEKKKKEEKKo.', '.oKKEkKKKKEkKKo.',
    '..oKKKKKKKKKKo..', '..oKKPPPPPPKKo..', '.ooKKKPPPPKKKoo.', 'oKKoKKKKKKKKoKKo', 'oKKoKKKKKKKKoKKo', '.ooKKKKKKKKKKoo.',
    '..oKKoKKKKoKKo..', '..oDDo.oo.oDDo..', '..oooo....oooo..', '................' ] },
  lich: { colors: { B: '#e3ecff', D: '#8d95b5', P: '#6a2c9e', G: '#c7ff5e', Y: '#ffd166' }, rows: [
    '......YYYY......', '.....YoooooY....', '.....oBBBBBBo...', '....oBBBBBBBBo..', '....oBGGBBGGBo..', '....oBGkBBGkBo..',
    '.....oBBBBBBo...', '.....oBkBkBko...', '....ooPPPPPPoo..', '...oPPPPPPPPPPo.', '..oPPPBBBBBBPPPo', '..oPPPPPPPPPPPPo',
    '..oPPPDDDDDDPPPo', '...oPPPPPPPPPPo.', '....oPPPPPPPPo..', '.....oooooooo...' ] },
  demonking: { colors: { R: '#e03a3a', D: '#8e1f1f', K: '#2a2a3e', Y: '#ffd166', E: '#ffe84a' }, rows: [
    '.oo..........oo.', 'oRRo..oooo..oRRo', '.oRRoRYYYYRoRRo.', '..oRRRYRRYRRRo..', '...oRRRRRRRRo...', '...oREERRREERo..',
    '...oREkRRREkRo..', '...oRRRRRRRRRo..', '....oRRkkkRRo...', '..oooKKKKKKKooo.', '.oRRoKKRRRRKKoRo', '.oRooKKKKKKKKooo',
    '..o.oKKKRRKKKo..', '....oKKKKKKKKo..', '....oDDDo.oDDo..', '....oooo..oooo..' ] },
};

const cache = new Map();
export function sprite(key, px = 4, tint = null) {
  const art = PIXEL_ART[key];
  if (!art) return null;
  const ck = `${key}:${px}:${tint || ''}`;
  if (cache.has(ck)) return cache.get(ck);
  const colors = Object.assign({}, BASE, art.colors);
  const w = art.rows[0].length, h = art.rows.length;
  const c = document.createElement('canvas'); c.width = w * px; c.height = h * px;
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = art.rows[y][x]; if (ch === '.' || ch === undefined) continue;
    ctx.fillStyle = tint || colors[ch] || '#ff00ff';
    ctx.fillRect(x * px, y * px, px, px);
  }
  cache.set(ck, c);
  return c;
}
export function spriteDataURL(key, px = 4) { const c = sprite(key, px); return c ? c.toDataURL() : ''; }
export function spriteSize(key) { const a = PIXEL_ART[key]; return a ? { w: a.rows[0].length, h: a.rows.length } : { w: 12, h: 12 }; }
export function spriteImg(key, size = 36, extraClass = '') {
  return `<img class="px ${extraClass}" src="${spriteDataURL(key)}" width="${size}" height="${size}" alt="">`;
}
