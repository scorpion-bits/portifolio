import {
  Application,
  Assets,
  Container,
  Rectangle,
  Sprite,
  AnimatedSprite,
  Texture,
} from 'pixi.js';

const BASE = import.meta.env.BASE_URL;

// Sprite sheet do detetive: células de 111×224. Linha 0 = idle (13 frames),
// linha 1 = caminhada (7 frames). Os pés ficam a ~208px do topo da célula.
const CELL_W = 111;
const CELL_H = 224;
const IDLE_FRAMES = 13;
const WALK_FRAMES = 7;
const FEET_Y = 208 / CELL_H;
const WALK_FACES_RIGHT = false; // o ciclo de caminhada do sprite olha para a esquerda

// Posição da lâmpada de mesa na arte do escritório (coordenadas da imagem).
const LAMP = { x: 195, y: 388 };

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function radialGlowTexture(size, rgb) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${rgb}, 0.9)`);
  g.addColorStop(0.4, `rgba(${rgb}, 0.28)`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}

function sheetFrames(texture, row, count) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    frames.push(
      new Texture({
        source: texture.source,
        frame: new Rectangle(i * CELL_W, row * CELL_H, CELL_W, CELL_H),
      }),
    );
  }
  return frames;
}

/**
 * Cena PixiJS que fica atrás dos slides: poeira em suspensão, o escritório do
 * projeto noir na capa e o detetive que caminha pelo "chão" conforme o slide muda.
 */
export async function createStage(host) {
  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: false,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });
  host.appendChild(app.canvas);

  const [officeTex, sheetTex] = await Promise.all([
    Assets.load(`${BASE}assets/noir/escritorio.png`),
    Assets.load(`${BASE}assets/noir/detetive-sprites.png`),
  ]);
  sheetTex.source.scaleMode = 'linear';
  sheetTex.source.autoGenerateMipmaps = true;

  const reduced = prefersReducedMotion();

  // ---- poeira ----
  const dust = new Container();
  const motes = [];
  for (let i = 0; i < 70; i++) {
    const s = new Sprite(Texture.WHITE);
    const size = Math.random() < 0.8 ? 2 : 3;
    s.width = s.height = size;
    s.tint = Math.random() < 0.7 ? 0xe0a15a : 0xf3e3c8;
    s.alpha = 0.1 + Math.random() * 0.3;
    motes.push({
      sprite: s,
      vx: (Math.random() - 0.5) * 6,
      vy: -(4 + Math.random() * 10),
      depth: 0.3 + Math.random() * 0.7,
    });
    dust.addChild(s);
  }
  app.stage.addChild(dust);

  // ---- escritório (capa) ----
  const office = new Container();
  const officeSprite = new Sprite(officeTex);
  const glow = new Sprite(radialGlowTexture(256, '255, 196, 110'));
  glow.anchor.set(0.5);
  glow.blendMode = 'add';
  glow.position.set(LAMP.x, LAMP.y);
  glow.width = glow.height = 300;
  office.addChild(officeSprite, glow);
  app.stage.addChild(office);

  // ---- chão e detetive ----
  const floor = new Container();
  app.stage.addChild(floor);

  const idleFrames = sheetFrames(sheetTex, 0, IDLE_FRAMES);
  const walkFrames = sheetFrames(sheetTex, 1, WALK_FRAMES);
  const walker = new AnimatedSprite(idleFrames);
  walker.anchor.set(0.5, FEET_Y);
  walker.animationSpeed = 0.1;
  walker.play();
  app.stage.addChild(walker);

  const state = {
    index: 0,
    count: 1,
    targetX: 0,
    mode: 'idle',
    facing: 1,
    pointer: { x: 0, y: 0 },
    officeAlpha: 1,
    officeTarget: 1,
  };

  let W = 0;
  let H = 0;
  let floorY = 0;
  let minX = 0;
  let maxX = 0;
  let walkerScale = 0.5;

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    walker.textures = mode === 'walk' ? walkFrames : idleFrames;
    walker.animationSpeed = mode === 'walk' ? 0.16 : 0.1;
    walker.gotoAndPlay(0);
  }

  function slideX(i) {
    if (state.count <= 1) return minX;
    return minX + ((maxX - minX) * i) / (state.count - 1);
  }

  function layout() {
    W = app.screen.width;
    H = app.screen.height;
    const narrow = W < 640;
    const floorOffset = narrow ? 84 : 96;
    floorY = H - floorOffset;
    minX = narrow ? 50 : 170;
    maxX = W - (narrow ? 50 : 170);

    walkerScale = Math.max(0.26, Math.min(0.42, (H * 0.11) / 183));
    walker.scale.set(walkerScale * state.facing * (WALK_FACES_RIGHT ? 1 : -1), walkerScale);
    walker.y = floorY;
    state.targetX = slideX(state.index);
    if (state.mode === 'idle') walker.x = state.targetX;

    // chão tracejado em "pixels"
    floor.removeChildren().forEach((c) => c.destroy());
    for (let x = 24; x < W - 24; x += 14) {
      const dash = new Sprite(Texture.WHITE);
      dash.tint = 0xe0a15a;
      dash.alpha = 0.22;
      dash.width = 8;
      dash.height = 3;
      dash.position.set(x, floorY + 2);
      floor.addChild(dash);
    }

    // escritório: escala inteira quando ampliado, para manter o pixel art nítido
    const availH = Math.max(240, H - floorOffset - 150);
    let s = Math.min(availH / officeTex.height, (narrow ? W * 0.9 : W * 0.42) / officeTex.width);
    s = s >= 1 ? Math.floor(s) : s;
    officeTex.source.scaleMode = s >= 1 ? 'nearest' : 'linear';
    office.scale.set(s);
    const ow = officeTex.width * s;
    const oh = officeTex.height * s;
    office.baseX = narrow ? (W - ow) / 2 : W * 0.7 - ow / 2;
    office.baseY = Math.max(56, (H - floorOffset - oh) / 2);
    office.position.set(office.baseX, office.baseY);
    office.narrow = narrow;

    for (const m of motes) {
      m.sprite.x = Math.random() * W;
      m.sprite.y = Math.random() * H;
    }
  }

  layout();
  app.renderer.on('resize', layout);

  window.addEventListener('pointermove', (e) => {
    state.pointer.x = e.clientX / window.innerWidth - 0.5;
    state.pointer.y = e.clientY / window.innerHeight - 0.5;
  });

  let t = 0;
  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    t += dt;

    // detetive
    const dx = state.targetX - walker.x;
    if (Math.abs(dx) > 2) {
      if (reduced) {
        walker.x = state.targetX;
      } else {
        state.facing = dx > 0 ? 1 : -1;
        walker.scale.x = walkerScale * state.facing * (WALK_FACES_RIGHT ? 1 : -1);
        setMode('walk');
        const speed = Math.max(380, Math.abs(dx) * 1.6);
        walker.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      }
    } else {
      walker.x = state.targetX;
      setMode('idle');
    }

    // escritório: aparece só na capa, brilho de lâmpada e leve parallax
    state.officeAlpha += (state.officeTarget - state.officeAlpha) * Math.min(1, dt * 6);
    const baseAlpha = office.narrow ? 0.3 : 1;
    office.alpha = state.officeAlpha * baseAlpha;
    office.visible = office.alpha > 0.01;
    glow.alpha = 0.55 + (reduced ? 0 : Math.sin(t * 1.7) * 0.08 + Math.sin(t * 7.3) * 0.03);
    if (!reduced) {
      office.x = office.baseX + state.pointer.x * -10;
      office.y = office.baseY + state.pointer.y * -6;
    }

    // poeira
    if (!reduced) {
      for (const m of motes) {
        const s = m.sprite;
        s.x += (m.vx + state.pointer.x * -8 * m.depth) * dt;
        s.y += m.vy * m.depth * dt;
        if (s.y < -4) {
          s.y = H + 4;
          s.x = Math.random() * W;
        }
        if (s.x < -4) s.x = W + 4;
        if (s.x > W + 4) s.x = -4;
      }
    }
  });

  return {
    /** Informa o slide atual; o detetive caminha até a posição correspondente. */
    setSlide(index, count) {
      state.index = index;
      state.count = count;
      state.targetX = slideX(index);
      state.officeTarget = index === 0 ? 1 : 0;
    },
  };
}
