// 아기자기한 치비 픽셀 스프라이트 (16x16). 외부 이미지 없이 코드에서 생성·캐시한다.
//  - 인간형 유닛: 공통 치비 템플릿(큰 머리·큰 눈·볼터치) + 모자/등/무기 레이어 합성
//  - 무기 레이어는 idle / attack 두 포즈 → 공격 프레임
//  - 눈·허리띠 색 = 속성 색 (속성이 한눈에 보이도록)
//  - 비인간형(슬라임·독사·정령·신화·몬스터·보스)은 개별 그리드
import { UNITS, ELEMENTS } from './config.js';

const SIZE = 16;
const BASE = { o: '#2b2340', W: '#ffffff', k: '#1a1428', s: '#ffe3c8', b: '#ffb3b8', y: '#ffd166', r: '#ff5c7a', w: '#f4f6ff' };

// 치비 템플릿: H 머리카락, s 피부, E 눈(속성색), W 눈 하이라이트, b 볼터치, B 옷, d 허리띠(속성색), f 신발
const TEMPLATE = [
  '................',
  '.....oooooo.....',
  '....oHHHHHHo....',
  '...oHHHHHHHHo...',
  '..oHHHHHHHHHHo..',
  '..oHssssssssHo..',
  '..ossWEssWEsso..',
  '..ossEEssEEsso..',
  '..osbssskssbso..',
  '...oossssssoo...',
  '.....oBBBBo.....',
  '....oBBBBBBo....',
  '....oBBddBBo....',
  '....oBBBBBBo....',
  '....ofo..ofo....',
  '....ooo..ooo....',
];

// 레이어 도형. x,y = 캔버스 좌상단 기준 배치. 'x' = 지우기(투명). 색 글자는 유닛이 colors로 공급.
const SHAPES = {
  // ── 머리 장식 (A 주색, a 보조색) ──
  hood:   { x: 2, y: 1, rows: ['...oooooo...', '..oAAAAAAo..', '.oAAAAAAAAo.', 'oAAAAAAAAAAo', 'oAa......aAo', 'oa........ao'] },
  pointy: { x: 2, y: 0, rows: ['.......oo...', 'xxxxxxoAAoxx', 'xxxxxoAAAAox', 'xxxoAAAAAAAo', 'xxoAAAAAAAAo', 'oAAAAaaAAAAo'] },
  bighat: { x: 1, y: 0, rows: ['........oo....', 'xxxxxxxoAAoxxx', 'xxxxxxoAAAAoxx', 'xxxxoAAAAAAAox', 'xxxoAAAAAAAAox', 'oAAAAAAaaAAAAo', '.oooooooooooo.'] },
  crown:  { x: 4, y: 0, rows: ['.A..A..A.', 'oAAAAAAAo'] },
  straw:  { x: 1, y: 1, rows: ['....oAAAAAAo..', '...oAAAAAAAAo.', 'oaaaaaaaaaaaao', '.oooooooooooo.'] },
  cap:    { x: 1, y: 1, rows: ['....oooooo....', '...oAAAAAAo...', '..oAAAAAAAAo..', '.oAAAAAAAAAAo.', 'oaaaaaaaaaaaao'] },
  helm:   { x: 2, y: 1, rows: ['...oooooo...', '..oAAAAAAo..', '.oAaAAAAaAo.', 'oAAAAAAAAAAo', 'oAAo....oAAo', 'oAo......oAo'] },
  horns:  { x: 1, y: 0, rows: ['oAo........oAo', 'oAAo......oAAo', '.oAA......AAo.'] },
  halo:   { x: 4, y: 0, rows: ['.oyyyyyo.'] },
  mask:   { x: 2, y: 8, rows: ['oAAAAAAAAAAo', '.oAAAAAAAAo.'] },
  bandana:{ x: 2, y: 4, rows: ['oAAAAAAAAAAoA.', 'oaaaaaaaaaaooA'] },
  feather:{ x: 11, y: 0, rows: ['..oo.', '.oAAo', 'oAAo.', 'oAo..'] },
  tiara:  { x: 5, y: 0, rows: ['..oyo..', 'oyoyoyo'] },
  // ── 등 뒤 (K 주색) ──
  wings:  { x: 0, y: 7, rows: ['oo............oo', 'oKKo........oKKo', 'oKKKo......oKKKo', '.oKKKo....oKKKo.', '..oKKKo..oKKKo..', '...oKKo..oKKo...', '....oo....oo....'] },
  cape:   { x: 3, y: 9, rows: ['oo........oo', 'oKo......oKo', 'oKKo....oKKo', 'oKKo....oKKo', 'oKKo....oKKo', '.oo......oo.'] },
  // ── 무기 (T 주색, U 보조색, 그 외는 유닛 colors) ──
  bow:     { idle: { x: 12, y: 8, rows: ['.oo.', 'oT.o', 'oTUo', 'oTUo', 'oT.o', '.oo.'] },
            attack: { x: 11, y: 8, rows: ['.oo..', 'oTUo.', 'oTUoo', 'oTUUU', 'oTUo.', '.oo..'] } },
  sword:   { idle: { x: 13, y: 7, rows: ['.o.', 'oTo', 'oTo', 'oTo', 'oTo', 'oUo', 'oUo', '.o.'] },
            attack: { x: 11, y: 8, rows: ['....o', '...oT', '..oTo', '.oTo.', 'oUo..', '.o...'] } },
  katana:  { idle: { x: 13, y: 6, rows: ['.o.', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo', 'oUo', 'oUo'] },
            attack: { x: 9, y: 10, rows: ['......o', 'oUoTTTT', '......o'] } },
  spear:   { idle: { x: 13, y: 3, rows: ['.o.', 'oUo', 'oUo', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo'] },
            attack: { x: 8, y: 10, rows: ['.......o', 'oTTTTTUU', '.......o'] } },
  scythe:  { idle: { x: 12, y: 6, rows: ['oUUo', 'o..U', 'oT..', 'oT..', 'oT..', 'oT..', 'oT..', 'oT..'] },
            attack: { x: 9, y: 9, rows: ['oTTTTo.', '....oUU', '......U', '.....UU'] } },
  staff:   { idle: { x: 13, y: 5, rows: ['oGo', 'GGG', 'oGo', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo'] },
            attack: { x: 11, y: 3, rows: ['G...G', '.oGo.', 'oGGGo', '.oGo.', 'G.oTo', '..oTo', '..oTo', '..oTo'] } },
  wand:    { idle: { x: 13, y: 8, rows: ['.G.', 'GGG', '.G.', '.T.', '.T.', '.T.'] },
            attack: { x: 12, y: 5, rows: ['G.G.', '.oG.', 'GGGG', '.oG.', 'G.T.', '..T.', '..T.'] } },
  crossbow:{ idle: { x: 11, y: 10, rows: ['oTooo', '.TTTT', 'oTooo'] },
            attack: { x: 9, y: 10, rows: ['..oTooo', 'UU.TTTT', '..oTooo'] } },
  dagger:  { idle: { x: 13, y: 9, rows: ['oTo', 'oTo', 'oUo'] },
            attack: { x: 11, y: 10, rows: ['...oT', '..oTo', '.oUo.', 'oo...'] } },
  flame:   { idle: { x: 13, y: 8, rows: ['.F.', 'FGF', 'FFF'] },
            attack: { x: 11, y: 6, rows: ['..F..', '.FGF.', 'FGGGF', 'FGGGF', '.FFF.'] } },
  rifle:   { idle: { x: 13, y: 3, rows: ['.o.', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo', 'oUo', 'oUo', 'oUo'] },
            attack: { x: 8, y: 10, rows: ['.......G', 'oUUTTTTT', '.......G'] } },
  greatsword:{ idle: { x: 12, y: 4, rows: ['.oo.', 'oTTo', 'oTTo', 'oTTo', 'oTTo', 'oTTo', 'oTTo', '.oo.', 'oUUo', '.oo.'] },
            attack: { x: 7, y: 10, rows: ['...oooooo', 'oUoTTTTTT', '...oooooo'] } },
  hourglass:{ idle: { x: 13, y: 8, rows: ['ooo', 'oGo', '.T.', 'oGo', 'ooo'] },
            attack: { x: 12, y: 4, rows: ['G.G.', 'ooo.', 'oGo.', '.T..', 'oGo.', 'ooo.', 'G.G.'] } },
  lance:   { idle: { x: 13, y: 3, rows: ['.y.', 'yGy', '.y.', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo', 'oTo'] },
            attack: { x: 7, y: 10, rows: ['........y', 'oTTTTTTGy', '........y'] } },
};

// 인간형 유닛 정의: colors + layers([shape, extraColors]). 눈/허리띠는 속성색 자동.
const HUMAN = {
  archer:   { colors: { H: '#e3b94d', B: '#4caf6e', f: '#3b2a4a' }, layers: [['hood', { A: '#3f9a5f', a: '#2a6b42' }], ['bow', { T: '#8b5a2b', U: '#f0f0f0' }]] },
  sword:    { colors: { H: '#7a4a2a', B: '#4e7fd9', f: '#2c4f9e' }, layers: [['helm', { A: '#c9d3e6', a: '#8a94a8' }], ['sword', { T: '#dfe6f5', U: '#ff9f43' }]] },
  spear:    { colors: { H: '#2f3a5a', B: '#d9534f', f: '#7a2622' }, layers: [['spear', { T: '#8b5a2b', U: '#9fe8ff' }]] },
  farmer:   { colors: { H: '#8b5a2b', B: '#6ca0dc', f: '#3b2a4a' }, layers: [['straw', { A: '#f2d16b', a: '#d4ac3a' }], ['scythe', { T: '#8b5a2b', U: '#dfe6f5' }]] },
  mage:     { colors: { H: '#e0e0f0', B: '#4e7fd9', f: '#2c4f9e' }, layers: [['pointy', { A: '#4e7fd9', a: '#ffd166' }], ['staff', { T: '#8b5a2b', G: '#ffe84a' }]] },
  hunter:   { colors: { H: '#5a3a1e', B: '#e58f3d', f: '#5a3a1e' }, layers: [['cap', { A: '#8a6a3a', a: '#5a3a1e' }], ['feather', { A: '#7ee8c9' }], ['rifle', { T: '#8b5a2b', U: '#555c6e', G: '#ffd166' }]] },
  frost:    { colors: { H: '#bfe9ff', B: '#9fe8ff', f: '#3fb6e0' }, layers: [['crown', { A: '#e6fbff' }], ['wand', { T: '#dfe6f5', G: '#9fe8ff' }]] },
  crossbow: { colors: { H: '#3b2a4a', B: '#aab4c8', f: '#5c6678' }, layers: [['helm', { A: '#7c8698', a: '#c9924a' }], ['crossbow', { T: '#8b5a2b', U: '#dfe6f5' }]] },
  rogue:    { colors: { H: '#2a2a3e', B: '#6a4fcf', f: '#2a2a3e' }, layers: [['bandana', { A: '#9b6bff', a: '#5e2ca5' }], ['dagger', { T: '#dfe6f5', U: '#ff5c7a' }]] },
  pyro:     { colors: { H: '#ff7a1a', B: '#d9342b', f: '#6a1a16' }, layers: [['flame', { F: '#ff7a1a', G: '#ffe84a' }]] },
  sniper:   { colors: { H: '#d9c7a0', B: '#4f8a3c', f: '#2f5a24' }, layers: [['cap', { A: '#3a5a2a', a: '#2f5a24' }], ['rifle', { T: '#3a3f4e', U: '#8b5a2b', G: '#fff1b8' }]] },
  assassin: { colors: { H: '#1f1f2e', B: '#2a2a3e', f: '#15151f' }, layers: [['mask', { A: '#3b2a5e' }], ['katana', { T: '#dfe6f5', U: '#ff5c7a' }]] },
  dragonknight: { colors: { H: '#e03a3a', B: '#c9d3e6', f: '#8e1f1f' }, layers: [['cape', { K: '#8e1f1f' }], ['horns', { A: '#ffd166' }], ['greatsword', { T: '#ff9f43', U: '#8e1f1f' }]] },
  archmage: { colors: { H: '#f0f0f0', B: '#9b5de5', f: '#5e2ca5' }, layers: [['bighat', { A: '#5e2ca5', a: '#ffd166' }], ['staff', { T: '#ffd166', G: '#9b6bff' }]] },
  divinearcher: { colors: { H: '#f5c542', B: '#fff6d6', f: '#c9871b' }, layers: [['halo', {}], ['bow', { T: '#ffd166', U: '#ffffff' }]] },
  chrono:   { colors: { H: '#7ab8ff', B: '#2c4f9e', f: '#1b2d5e' }, layers: [['tiara', {}], ['hourglass', { T: '#ffd166', G: '#9fe8ff' }]] },
  archangel:{ colors: { H: '#f5c542', B: '#ffffff', f: '#c9871b' }, layers: [['wings', { K: '#fff6d6' }], ['halo', {}], ['lance', { T: '#ffd166', G: '#ffffff' }]] },
};

// 비인간형 유닛·몬스터·보스 (개별 그리드, 16x16)
const CUSTOM = {
  slime: { colors: { G: '#5fc9ff', D: '#2c86c9', L: '#c9f0ff' }, rows: [
    '................', '................', '................', '......oooo......', '....ooGGGGoo....', '...oGGLLGGGGo...',
    '..oGGLGGGGGGGo..', '..oGGGGGGGGGGo..', '.oGGWEGGGGWEGGo.', '.oGGEEGGGGEEGGo.', '.oGbGGGkkGGGbGo.', '.oGGGGGGGGGGGGo.',
    '.oDDDDDDDDDDDDo.', '..oooooooooooo..', '................', '................' ] },
  viper: { colors: { P: '#7cc44a', D: '#3e7f24', G: '#c7ff5e' }, rows: [
    '................', '.....oooooo.....', '....oPPPPPPo....', '...oPPPPPPPPo...', '...oPWEPPWEPo...', '...oPEEPPEEPo...',
    '...oPbPPPPbPo...', '....oPPrrPPo....', '.....oooPPo.....', '.......oPPo.....', '..oooo.oPPo.....', '.oPGGPooPPo.....',
    '.oPPPPPPPPo.....', '..oPGGGGPo......', '...oooooo.......', '................' ] },
  storm: { colors: { Y: '#ffe84a', D: '#e0a800', L: '#fff8c4', C: '#dfe6f5' }, rows: [
    '................', '.....oooo.......', '...ooCCCCoo.....', '..oCCCCCCCCo....', '.oCCCCCCCCCCo...', '.oCWECCCCWECo...',
    '.oCEECCCCEECo...', '.oCbCCCkCCbCo...', '..oCCCCCCCCo.o..', '...ooooooooooYo.', '......oYYYYYo...', '.....oYYYYo.....',
    '....oYYYo.......', '....oYYo........', '.....oo.........', '................' ] },
  phoenix: { colors: { F: '#ff7a1a', Y: '#ffe84a', R: '#d9342b' }, rows: [
    '......oo........', '.....oYYo.......', '....oFYYFo......', '...oFFFFFFo.....', '..oFWEFFWEFo....', '..oFEEFFEEFo....',
    '.oFFbFFkFFbFFo..', 'oFFoFFFFFFFoFFo.', 'oFFooFYYYFooFFo.', '.oo.oFYYYFo.oo..', '....oFFFFFo.....', '.....oRRRo......',
    '....oRRRRRo.....', '...oRRoRoRRo....', '..oRo.oRo.oRo...', '..oo..ooo..oo...' ] },
  worldtree: { colors: { G: '#4caf6e', D: '#2e7a4a', T: '#8b5a2b', L: '#a6e86f', P: '#ff9fcb' }, rows: [
    '.....oooooo.....', '...ooGGLGGGoo...', '..oGGGGGGGGLGo..', '.oGLGGGGGGGGGGo.', '.oGGGWEGGWEGGGo.', 'oGGGGEEGGEEGGGGo',
    'oGGPGGGGkGGGPGGo', 'oGGGGGGGGGGGGGGo', '.oGGGGLGGGGGGGo.', '..oooGGGGGGooo..', '.....oTTTTo.....', '.....oTTTTo.....',
    '....oTTTTTTo....', '...oTTTTTTTTo...', '..oTTooTToTTTo..', '..oooo.oo.oooo..' ] },
  chaoslord: { colors: { P: '#6a3fb5', D: '#3b1e6e', M: '#ff4d6d', L: '#c9a0ff' }, rows: [
    '...oo......oo...', '..oMo......oMo..', '.oMMoooooooMMo..', '.oMoPPPPPPPoMo..', '.ooPPPLPPPPPoo..', '.oPPPWMMMMPPPo..',
    '.oPPPMMMkMMPPo..', '.oPPPPMMMMPPPPo.', '.oPbPPPPPPPPbPo.', '..oPPPPPPPPPPo..', '...ooPPPPPPoo...', '..oPPDDPPDDPPo..',
    '.oPPPPPPPPPPPPo.', '.oPPPoPPPPoPPPo.', '..oo.oDDDDo.oo..', '......oooo......' ] },
  // ── 몬스터 ──
  normal: { colors: { E: '#ff5c7a', G: '#b56cff', D: '#7a3fb5', L: '#e0c8ff' }, rows: [
    '................', '..o..........o..', '.oGo........oGo.', '.oGGooooooooGGo.', '.oGGGGGGGGGGGGo.', '..oGGGGGGGGGGo..',
    '..oGGWEGGWEGGo..', '..oGGEEGGEEGGo..', '..oGbGGkkGGbGo..', '..oGGGGGGGGGGo..', '...oGGGGGGGGo...', '....oGGGGGGo....',
    '....oGoGGoGo....', '....oDooooDo....', '.....o....o.....', '................' ] },
  fast: { colors: { E: '#ffd166', G: '#9aa3b2', D: '#5c6678', L: '#e8ecf8', N: '#2b2340' }, rows: [
    '................', '................', '..oo........oo..', '.oGGo......oGGo.', '.oGGGooooooGGGo.', '.oGGGGGGGGGGGGo.',
    '..oGGWEGGGWEGGo.', '..oGGEEGGGEEGGo.', '..oGLLLLLLLLGGo.', '..oGLbLNNLbLGo..', '...oLLLLLLLLo...', '....oooLLooo....',
    '.......oo.......', '................', '................', '................' ] },
  shield: { colors: { E: '#4ea8ff', G: '#9c8a74', D: '#5e4d3a', L: '#c9b89f', M: '#6fa8dc' }, rows: [
    '................', '.....oooooo.....', '...ooGGGGGGoo...', '..oGGGLGGGGGGo..', '..oGGGGGGGGGGo..', '.oGGGWEGGGWEGGo.',
    '.oGGGEEGGGEEGGo.', '.oGGbGGGGGGbGGo.', '.oGGGGGGkkGGGGo.', '.oGGGGGGGGGGGGo.', '.oGGMMGGGGMMGGo.', '..oGGGGGGGGGGo..',
    '..oDDGGGGGGDDo..', '..oDDooooooDDo..', '...oo......oo...', '................' ] },
  // ── 보스 ──
  ogre: { colors: { E: '#ff5c7a', G: '#7bb661', D: '#4a7a3a', L: '#b7e39a', T: '#8b5a2b', Y: '#ffd166' }, rows: [
    '....oo....oo....', '...oYYo..oYYo...', '..ooGGoooooGGoo.', '.oGGGGGGGGGGGGo.', '.oGGGGGGGGGGGGo.', 'oGGGWEGGGGWEGGGo',
    'oGGGEEGGGGEEGGGo', 'oGGbGGGGGGGGbGGo', 'oGGGGGWooWGGGGGo', '.oGGGGGGGGGGGGo.', '.oGGGGoooGGGGGo.', '..oGGoTTTToGGo..',
    '..oGGoTTTToGGo..', '..oGGGoooooGGo..', '..oDDo....oDDo..', '..oooo....oooo..' ] },
  blackdragon: { colors: { E: '#ff7a1a', G: '#3b2a5e', D: '#241a3a', L: '#7a5fa8', M: '#ff7a1a', Y: '#ffe84a' }, rows: [
    '..oo........oo..', '.oLLo......oLLo.', '.oLLLooooooLLLo.', '..oLGGGGGGGGLo..', '..oGGGGGGGGGGo..', '.oGGWEGGGGWEGGo.',
    '.oGGEEGGGGEEGGo.', '.oGGGGGGGGGGGGo.', '.oGbGMMMMMMGbGo.', '.oGGGMYYYYMGGGo.', '..oGGMMMMMMGGo..', '..oGGGGGGGGGGo..',
    '.oLoGGGoooGGGoLo', 'oLLoGGo...oGGoLL', 'oLoDDDo...oDDDoo', '.oooooo...oooo..' ] },
  lich: { colors: { E: '#5ee39a', G: '#e8e8f0', D: '#9aa3b2', L: '#9b6bff', K: '#2a2a3e', Y: '#5ee39a' }, rows: [
    '.....oooooo.....', '....oLLLLLLo....', '...oLLLLLLLLo...', '..oLoGGGGGGoLo..', '..oGGGGGGGGGGo..', '..oGGYYGGYYGGo..',
    '..oGGYYGGYYGGo..', '..oGGGGGGGGGGo..', '..oGGkGkGkGGGo..', '...oGGGGGGGGo...', '..ooKKKKKKKKoo..', '.oKKKKKKKKKKKKo.',
    '.oKKKLLKKLLKKKo.', '.oKKKKKKKKKKKKo.', '..oKKoKKKKoKKo..', '..ooo.oooo.ooo..' ] },
  demonking: { colors: { E: '#ffe84a', G: '#d9342b', D: '#8a1f1a', L: '#ff9f43', Y: '#ffd166', K: '#2a2a3e' }, rows: [
    'oo....oooo....oo', 'oYo..oYYYYo..oYo', 'oYYooYoYYoYooYYo', '.oYYYYYYYYYYYYo.', '..oGGGGGGGGGGo..', '.oGGGWEGGGGWEGGo',
    '.oGGGEEGGGGEEGGo', '.oGGbGGGGGGGbGGo', '.oGGGGGWWWWGGGGo', '..oGGGGGGGGGGGo.', '..oKKKKKKKKKKKo.', '.oKKKLLKKKKLLKKo',
    '.oKKKKKKKKKKKKKo', '.oKKKKKKKKKKKKKo', '..oDDoKKKKoDDo..', '..oooo....oooo..' ] },
};

// ──────────── 합성 ────────────
function blank() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(null)); }
function stamp(grid, rows, x, y, colors) {
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
    const ch = rows[j][i]; if (ch === '.') continue;
    const px = x + i, py = y + j; if (px < 0 || py < 0 || px >= SIZE || py >= SIZE) continue;
    if (ch === 'x') { grid[py][px] = null; continue; }
    const col = colors[ch]; if (!col) throw new Error(`sprite color missing: '${ch}'`);
    grid[py][px] = col;
  }
}
function humanGrid(id, def, frame) {
  const u = UNITS[id], el = ELEMENTS[u.element].eye;
  const colors = { ...BASE, E: el, d: el, f: '#3b2a4a', ...def.colors };
  const grid = blank();
  const layers = def.layers.map(([name, extra]) => ({ name, shape: SHAPES[name], colors: { ...colors, ...extra } }));
  for (const L of layers) if (L.name === 'wings' || L.name === 'cape') stamp(grid, L.shape.rows, L.shape.x, L.shape.y, L.colors);
  stamp(grid, TEMPLATE, 0, 0, colors);
  for (const L of layers) {
    if (L.name === 'wings' || L.name === 'cape') continue;
    const sh = L.shape.rows ? L.shape : L.shape[frame];
    stamp(grid, sh.rows, sh.x, sh.y, L.colors);
  }
  return grid;
}
function customGrid(key, def) {
  const u = UNITS[key];
  const colors = { ...BASE, E: u ? ELEMENTS[u.element].eye : '#2b2340', ...def.colors };
  const grid = blank(); stamp(grid, def.rows, 0, 0, colors); return grid;
}

export function spriteGrid(key, frame = 'idle') {
  if (HUMAN[key]) return humanGrid(key, HUMAN[key], frame);
  if (CUSTOM[key]) return customGrid(key, CUSTOM[key]);
  return null;
}
export const SPRITE_KEYS = [...Object.keys(HUMAN), ...Object.keys(CUSTOM)];
export const hasAttackFrame = (key) => !!HUMAN[key];
export const spriteSize = () => SIZE;

// ──────────── 렌더 캐시 ────────────
const cache = new Map();
export function sprite(key, px = 4, tint = null, frame = 'idle') {
  if (!hasAttackFrame(key)) frame = 'idle';
  const ck = `${key}:${px}:${tint || ''}:${frame}`;
  if (cache.has(ck)) return cache.get(ck);
  const grid = spriteGrid(key, frame);
  if (!grid) { cache.set(ck, null); return null; }
  const c = document.createElement('canvas'); c.width = c.height = SIZE * px;
  const ctx = c.getContext('2d');
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const col = grid[y][x]; if (!col) continue;
    ctx.fillStyle = tint || col; ctx.fillRect(x * px, y * px, px, px);
  }
  cache.set(ck, c);
  return c;
}
export function spriteDataURL(key, px = 4, frame = 'idle') { const c = sprite(key, px, null, frame); return c ? c.toDataURL() : ''; }
export function spriteImg(key, size = 32, extraClass = '', frame = 'idle') {
  const url = spriteDataURL(key, 4, frame);
  return url ? `<img class="px ${extraClass}" src="${url}" width="${size}" height="${size}" alt="">` : '';
}
