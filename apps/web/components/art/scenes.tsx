import type { ReactNode } from "react";
import type { ArtMotif, ArtOption, ArtPalette } from "@/lib/catalogue/types";

/**
 * Original generative key-art scenes. Each scene is drawn by code from a title's palette, so no
 * third-party poster, still or logo is ever reproduced. Focal compositions are authored on a
 * 400×600 poster grid; backdrops place the same focal group on the right of a 1600×900 canvas and
 * extend the "field" layer across the full width.
 */
export interface SceneContext {
  p: ArtPalette;
  w: number;
  h: number;
  /** Scale of the focal composition on the canvas (1 for posters, 1.5 for backdrops). */
  s: number;
  /** Maps focal x (0–400) to canvas x. */
  fx: (x: number) => number;
  /** Maps focal y (0–600) to canvas y. */
  fy: (y: number) => number;
  id: (name: string) => string;
  url: (name: string) => string;
  option?: ArtOption;
  rand: () => number;
}

export interface Scene {
  defs?: ReactNode;
  field?: ReactNode;
  focal: ReactNode;
}

type SceneFn = (ctx: SceneContext) => Scene;

/** Rounds to one decimal place to keep generated path data compact. */
export const r1 = (n: number) => Math.round(n * 10) / 10;

function stars(rand: () => number, count: number, w: number, maxY: number, color: string) {
  return (
    <g fill={color}>
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={r1(rand() * w)}
          cy={r1(rand() * maxY)}
          r={r1(0.5 + rand() * 1.5)}
          opacity={r1(0.25 + rand() * 0.65)}
        />
      ))}
    </g>
  );
}

function skyline(
  rand: () => number,
  w: number,
  h: number,
  s: number,
  range: [number, number],
  fill: string,
  opacity: number,
  lights?: string,
) {
  const blocks: ReactNode[] = [];
  const windows: ReactNode[] = [];
  let x = -12 * s;
  let i = 0;
  while (x < w) {
    const bw = (16 + rand() * 34) * s;
    const bh = h * (range[0] + rand() * (range[1] - range[0]));
    blocks.push(<rect key={i} x={r1(x)} y={r1(h - bh)} width={r1(bw)} height={r1(bh)} />);
    if (lights) {
      const count = Math.floor(rand() * 4);
      for (let k = 0; k < count; k += 1) {
        windows.push(
          <rect
            key={`${i}-${k}`}
            x={r1(x + 4 * s + rand() * Math.max(bw - 10 * s, 1))}
            y={r1(h - bh + 8 * s + rand() * bh * 0.7)}
            width={r1(3 * s)}
            height={r1(4 * s)}
          />,
        );
      }
    }
    x += bw + rand() * 6 * s;
    i += 1;
  }
  return (
    <>
      <g fill={fill} opacity={opacity}>
        {blocks}
      </g>
      {lights ? (
        <g fill={lights} opacity={0.55}>
          {windows}
        </g>
      ) : null}
    </>
  );
}

function figure(x: number, y: number, size: number, color: string, key?: string | number) {
  // A tiny standing figure whose feet rest at (x, y).
  const k = size / 20;
  return (
    <g key={key} fill={color}>
      <circle cx={r1(x)} cy={r1(y - 17 * k)} r={r1(3 * k)} />
      <path
        d={`M${r1(x - 3 * k)} ${r1(y - 13.5 * k)} h${r1(6 * k)} l${r1(1.5 * k)} ${r1(13.5 * k)} h${r1(-9 * k)} Z`}
      />
    </g>
  );
}

/* ------------------------------------------------------------------- scenes */

const sun: SceneFn = ({ p, w, h, s, fx, id, url, option }) => {
  const horizon = h * 0.7;
  const cx = fx(200);
  const rails = option === "rails";
  return {
    defs: (
      <clipPath id={id("above")} clipPathUnits="userSpaceOnUse">
        <rect x={-700} width={1800} height={420} />
      </clipPath>
    ),
    field: (
      <>
        <circle cx={cx} cy={horizon} r={320 * s} fill={url("glow")} />
        <rect y={horizon} width={w} height={h - horizon} fill={p.ink} opacity={rails ? 0.9 : 0.6} />
        {rails
          ? null
          : Array.from({ length: 11 }, (_, i) => {
              const y = horizon + 10 * s + i * ((h - horizon - 10 * s) / 11);
              const half = (34 + i * 16) * s;
              return (
                <line
                  key={i}
                  x1={r1(cx - half)}
                  x2={r1(cx + half)}
                  y1={r1(y)}
                  y2={r1(y)}
                  stroke={p.accent}
                  strokeWidth={r1((2 + i * 0.7) * s)}
                  strokeLinecap="round"
                  opacity={r1(0.75 - i * 0.055)}
                />
              );
            })}
        <line
          x1={0}
          x2={w}
          y1={horizon}
          y2={horizon}
          stroke={p.light}
          strokeOpacity={0.35}
          strokeWidth={s}
        />
      </>
    ),
    focal: (
      <>
        <g clipPath={`url(#${id("above")})`}>
          {[232, 186, 150].map((radius, i) => (
            <circle
              key={radius}
              cx={200}
              cy={420}
              r={radius}
              fill="none"
              stroke={p.light}
              strokeOpacity={0.08 + i * 0.06}
              strokeWidth={2}
            />
          ))}
          <circle cx={200} cy={420} r={120} fill={p.accent} />
          <circle cx={200} cy={420} r={120} fill={url("glow")} opacity={0.65} />
        </g>
        {rails ? (
          <g stroke={p.light} strokeOpacity={0.6} strokeLinecap="round">
            <line x1={30} y1={600} x2={196} y2={420} strokeWidth={5} />
            <line x1={370} y1={600} x2={204} y2={420} strokeWidth={5} />
            {Array.from({ length: 9 }, (_, i) => {
              const t = Math.pow((i + 1) / 10, 1.7);
              const y = 420 + 180 * t;
              const half = 8 + 172 * t;
              return (
                <line
                  key={i}
                  x1={r1(200 - half)}
                  x2={r1(200 + half)}
                  y1={r1(y)}
                  y2={r1(y)}
                  strokeWidth={r1(1 + 4 * t)}
                />
              );
            })}
          </g>
        ) : (
          <g fill={p.ink}>
            <path d="M146 470 Q200 486 254 470 L244 482 Q200 494 156 482 Z" />
            <circle cx={188} cy={436} r={6} />
            <path d="M182 444 h12 l3 28 h-18 Z" />
            <circle cx={212} cy={440} r={5.5} />
            <path d="M207 447 h10 l7 25 h-24 Z" />
          </g>
        )}
      </>
    ),
  };
};

const CRATERS: readonly [number, number, number][] = [
  [160, 212, 22],
  [232, 300, 30],
  [188, 322, 14],
  [262, 198, 12],
  [148, 280, 10],
  [246, 252, 9],
];

const moon: SceneFn = ({ p, w, h, s, id, url, option, rand }) => {
  const crescent = option === "crescent";
  const ground = h * 0.88;
  let groundPath = `M0 ${r1(h)} V${r1(ground)}`;
  for (let x = 0; x <= w + 40 * s; x += 40 * s) {
    groundPath += ` L${r1(x)} ${r1(ground + (rand() - 0.5) * 16 * s)}`;
  }
  groundPath += ` V${r1(h)} Z`;
  return {
    defs: crescent ? (
      <mask id={id("cres")} maskUnits="userSpaceOnUse" x={0} y={0} width={400} height={600}>
        <rect width={400} height={600} fill="#fff" />
        <circle cx={294} cy={158} r={108} fill="#000" />
      </mask>
    ) : (
      <clipPath id={id("disc")} clipPathUnits="userSpaceOnUse">
        <circle cx={210} cy={250} r={140} />
      </clipPath>
    ),
    field: (
      <>
        {stars(rand, Math.round((w * h) / 3000), w, ground, p.light)}
        <path d={groundPath} fill={p.ink} opacity={0.92} />
      </>
    ),
    focal: crescent ? (
      <>
        <circle cx={250} cy={190} r={176} fill={url("glow")} />
        <circle cx={250} cy={190} r={118} fill={p.light} mask={`url(#${id("cres")})`} />
        <path
          d="M36 590 C 70 470, 130 360, 226 286"
          fill="none"
          stroke={p.accent}
          strokeWidth={3}
          strokeDasharray="2 12"
          strokeLinecap="round"
        />
        <g transform="translate(232 280) rotate(52)">
          <path
            d="M0 -30 C 9 -16, 10 12, 7 22 H -7 C -10 12, -9 -16, 0 -30 Z"
            fill={p.light}
            stroke={p.ink}
            strokeWidth={2.5}
          />
          <path d="M-7 12 L-15 26 L-7 22 Z M7 12 L15 26 L7 22 Z" fill={p.accent} />
          <path d="M-5 24 L0 42 L5 24 Z" fill={p.accent} opacity={0.9} />
        </g>
      </>
    ) : (
      <>
        <circle cx={210} cy={250} r={180} fill={url("glow")} />
        <circle cx={210} cy={250} r={140} fill={p.light} />
        <g clipPath={`url(#${id("disc")})`}>
          <circle cx={264} cy={220} r={140} fill={p.ink} opacity={0.16} />
          {CRATERS.map(([x, y, radius]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={radius} fill={p.bg2} opacity={0.3} />
          ))}
        </g>
        <g transform="translate(296 168) rotate(140)">
          <path
            d="M-22 -11 H14 L36 0 L14 11 H-22 Z"
            fill={p.accent}
            stroke={p.ink}
            strokeWidth={3}
          />
          <line x1={-8} y1={-11} x2={-8} y2={11} stroke={p.ink} strokeWidth={2} />
        </g>
        <g stroke={p.light} strokeWidth={3} strokeLinecap="round" opacity={0.85}>
          <line x1={320} y1={150} x2={338} y2={132} />
          <line x1={326} y1={170} x2={352} y2={168} />
          <line x1={306} y1={140} x2={311} y2={116} />
        </g>
      </>
    ),
  };
};

const shadow: SceneFn = ({ p, w, h, url }) => {
  let stairs = "M0 600";
  let x = 0;
  let y = 600;
  for (let i = 0; i < 12; i += 1) {
    y -= 40;
    x = Math.min(400, x + 36);
    stairs += ` V${y} H${x}`;
  }
  stairs += " V600 Z";
  return {
    field: (
      <>
        <circle cx={w * 0.84} cy={h * 0.8} r={h * 0.7} fill={url("glow")} />
        <rect y={h * 0.94} width={w} height={h * 0.06} fill={p.ink} opacity={0.6} />
      </>
    ),
    focal: (
      <>
        <g fill={p.ink} opacity={0.9} transform="translate(-25 -65) scale(1.05)">
          <ellipse cx={212} cy={196} rx={19} ry={28} />
          <path d="M194 182 L188 168 L200 176 Z M228 183 L235 170 L225 177 Z" />
          <path d="M228 196 L236 202 L229 207 Z" />
          <path d="M200 222 C176 262 168 336 178 430 L196 600 L140 600 L146 430 C140 338 158 258 192 218 Z" />
          <path d="M206 244 C236 238 268 220 298 198 L304 207 C274 230 244 250 212 260 Z" />
        </g>
        <g
          stroke={p.ink}
          strokeWidth={4.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.9}
          transform="translate(-25 -65) scale(1.05)"
        >
          <path d="M300 200 Q322 178 344 164" />
          <path d="M302 203 Q328 188 350 180" />
          <path d="M302 206 Q328 200 348 197" />
          <path d="M300 209 Q322 212 340 214" />
        </g>
        <path d={stairs} fill={p.bg2} opacity={0.9} />
        <line x1={0} y1={470} x2={400} y2={26} stroke={p.ink} strokeWidth={6} />
        <g stroke={p.ink} strokeWidth={3} opacity={0.85}>
          {Array.from({ length: 11 }, (_, i) => {
            const bx = 18 + i * 36;
            const top = 470 - 1.11 * bx;
            const tread = 600 - 40 * (Math.floor(bx / 36) + 1);
            return <line key={i} x1={bx} x2={bx} y1={r1(top)} y2={tread} />;
          })}
        </g>
      </>
    ),
  };
};

const tower: SceneFn = ({ p, w, h, s, fx, fy, url, rand }) => ({
  field: (
    <>
      <circle cx={fx(200)} cy={fy(140)} r={280 * s} fill={url("glow")} />
      <g fill={p.light} opacity={0.06}>
        <polygon
          points={`${r1(w * 0.15)},${h} ${r1(w * 0.19)},${h} ${r1(w * 0.42)},0 ${r1(w * 0.33)},0`}
        />
        <polygon
          points={`${r1(w * 0.9)},${h} ${r1(w * 0.94)},${h} ${r1(w * 0.7)},0 ${r1(w * 0.62)},0`}
        />
      </g>
      {skyline(rand, w, h, s, [0.22, 0.55], p.ink, 0.6, p.accent)}
    </>
  ),
  focal: (
    <>
      <g fill={p.ink}>
        <rect x={70} y={230} width={56} height={370} />
        <polygon points="70,230 98,196 126,230" />
        <rect x={274} y={200} width={58} height={400} />
        <polygon points="274,200 303,164 332,200" />
        <rect x={146} y={130} width={108} height={470} />
        <rect x={162} y={78} width={76} height={56} />
        <rect x={178} y={36} width={44} height={46} />
      </g>
      <line x1={200} y1={0} x2={200} y2={36} stroke={p.ink} strokeWidth={4} />
      <g stroke={p.accent} strokeWidth={2} opacity={0.85}>
        <line x1={146} y1={130} x2={146} y2={600} />
        <line x1={254} y1={130} x2={254} y2={600} />
        <line x1={162} y1={78} x2={162} y2={130} />
        <line x1={238} y1={78} x2={238} y2={130} />
        <line x1={178} y1={36} x2={178} y2={78} />
        <line x1={222} y1={36} x2={222} y2={78} />
      </g>
      <g stroke={p.accent} strokeWidth={3} opacity={0.22}>
        {Array.from({ length: 28 }, (_, i) => (
          <line key={i} x1={152} x2={248} y1={150 + i * 16} y2={150 + i * 16} />
        ))}
      </g>
      <g stroke={p.light} strokeWidth={4} opacity={0.55}>
        <line x1={126} x2={146} y1={300} y2={300} />
        <line x1={126} x2={146} y1={384} y2={384} />
        <line x1={254} x2={274} y1={262} y2={262} />
        <line x1={254} x2={274} y1={352} y2={352} />
      </g>
    </>
  ),
});

const steps: SceneFn = ({ p, w, h, rand }) => {
  const people: ReactNode[] = [];
  for (let i = 0; i < 10; i += 1) {
    const row = 1 + Math.floor(rand() * 13);
    const y = 150 + row * 30;
    const x0 = 70 + row * 10;
    people.push(figure(x0 + 30 + rand() * (360 - x0), y, 22, p.ink, i));
  }
  return {
    field: (
      <polygon
        points={`0,${r1(h * 0.07)} ${w},0 ${w},${r1(h * 0.1)} 0,${r1(h * 0.17)}`}
        fill={p.accent}
      />
    ),
    focal: (
      <>
        {Array.from({ length: 15 }, (_, i) => {
          const y = 150 + i * 30;
          const x0 = 70 + i * 10;
          return (
            <g key={i}>
              <rect x={x0} y={y} width={400 - x0} height={30} fill={i % 2 ? p.bg2 : p.light} />
              <line x1={x0} y1={y} x2={400} y2={y} stroke={p.ink} strokeWidth={3} />
            </g>
          );
        })}
        {people}
        <polygon points="0,118 70,140 222,600 0,600" fill={p.ink} />
        <g>
          <path d="M250 330 Q286 296 322 320 L322 342 L248 342 Z" fill={p.accent} />
          <line x1={322} y1={328} x2={348} y2={302} stroke={p.ink} strokeWidth={4} />
          {[268, 306].map((cx) => (
            <g key={cx} stroke={p.ink}>
              <circle cx={cx} cy={368} r={22} fill="none" strokeWidth={5} />
              {Array.from({ length: 4 }, (_, k) => {
                const angle = (k * Math.PI) / 4;
                return (
                  <line
                    key={k}
                    x1={r1(cx - Math.cos(angle) * 20)}
                    y1={r1(368 - Math.sin(angle) * 20)}
                    x2={r1(cx + Math.cos(angle) * 20)}
                    y2={r1(368 + Math.sin(angle) * 20)}
                    strokeWidth={2}
                  />
                );
              })}
            </g>
          ))}
        </g>
      </>
    ),
  };
};

const shards: SceneFn = ({ p, w, h, s, fx, fy }) => {
  const ox = fx(200);
  const oy = fy(120);
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a0 = (i / 16) * Math.PI * 2;
    const a1 = a0 + Math.PI / 26;
    const len = Math.max(w, h) * 1.4;
    return (
      <polygon
        key={i}
        points={`${r1(ox)},${r1(oy)} ${r1(ox + Math.cos(a0) * len)},${r1(oy + Math.sin(a0) * len)} ${r1(ox + Math.cos(a1) * len)},${r1(oy + Math.sin(a1) * len)}`}
      />
    );
  });
  return {
    field: (
      <>
        <g fill={p.light} opacity={0.07}>
          {rays}
        </g>
        <polygon
          points={`0,${r1(h * 0.82)} ${r1(w * 0.3)},${r1(h * 0.7)} ${w},${r1(h * 0.86)} ${w},${h} 0,${h}`}
          fill={p.ink}
          opacity={0.75}
        />
        <g stroke={p.accent} strokeWidth={2 * s} opacity={0.35}>
          <line x1={0} y1={r1(h * 0.2)} x2={r1(w * 0.4)} y2={r1(h * 0.05)} />
          <line x1={r1(w * 0.55)} y1={r1(h * 0.02)} x2={w} y2={r1(h * 0.24)} />
        </g>
      </>
    ),
    focal: (
      <>
        <g fill={p.ink} stroke={p.light} strokeOpacity={0.35} strokeWidth={2}>
          <polygon points="20,600 34,330 92,272 128,322 136,600" />
          <polygon points="246,600 262,296 304,244 356,312 330,600" />
          <polygon points="146,600 176,196 206,168 232,220 214,600" />
        </g>
        <g fill={p.accent}>
          <polygon points="186,262 200,252 198,292 184,300" />
          <polygon points="60,360 82,352 78,384 58,390" />
          <polygon points="284,320 304,306 306,340 286,350" />
          <polygon points="190,350 204,344 202,370 188,376" />
        </g>
        <path
          d="M168 600 L232 520 L182 470 L244 398 L218 380 L190 402 L150 470 L200 520 L118 600 Z"
          fill={p.light}
          opacity={0.85}
        />
        <path d="M312 600 L316 450 L322 438 L328 450 L332 600 Z" fill={p.ink} />
        <circle cx={322} cy={432} r={7} fill={p.ink} />
      </>
    ),
  };
};

const lens: SceneFn = ({ p, w, h, s }) => {
  const band = h * 0.84;
  const holes: ReactNode[] = [];
  for (let x = 6 * s, i = 0; x < w; x += 22 * s, i += 1) {
    holes.push(
      <rect
        key={`t${i}`}
        x={r1(x)}
        y={r1(band + 6 * s)}
        width={r1(10 * s)}
        height={r1(8 * s)}
        rx={2}
      />,
    );
    holes.push(
      <rect
        key={`b${i}`}
        x={r1(x)}
        y={r1(band + 50 * s)}
        width={r1(10 * s)}
        height={r1(8 * s)}
        rx={2}
      />,
    );
  }
  return {
    field: (
      <>
        <g stroke={p.light} strokeOpacity={0.07} strokeWidth={s}>
          {Array.from({ length: 24 }, (_, i) => (
            <line key={i} x1={r1((i / 24) * w)} x2={r1((i / 24) * w)} y1={0} y2={band} />
          ))}
        </g>
        <rect y={r1(band)} width={w} height={r1(64 * s)} fill={p.ink} />
        <g fill={p.light} opacity={0.65}>
          {holes}
        </g>
      </>
    ),
    focal: (
      <>
        <polygon points="0,340 400,186 400,236 0,392" fill={p.accent} opacity={0.88} />
        <g stroke={p.ink} strokeWidth={8} strokeLinecap="round">
          <line x1={200} y1={410} x2={112} y2={560} />
          <line x1={200} y1={410} x2={200} y2={560} />
          <line x1={200} y1={410} x2={288} y2={560} />
        </g>
        <rect x={176} y={396} width={48} height={24} rx={4} fill={p.ink} />
        <circle cx={200} cy={270} r={150} fill={p.ink} />
        <circle
          cx={200}
          cy={270}
          r={134}
          fill="none"
          stroke={p.light}
          strokeOpacity={0.4}
          strokeWidth={2}
        />
        <circle cx={200} cy={270} r={118} fill={p.bg2} />
        <circle cx={200} cy={270} r={100} fill="none" stroke={p.accent} strokeWidth={6} />
        <circle cx={200} cy={270} r={82} fill={p.ink} />
        <circle
          cx={200}
          cy={270}
          r={62}
          fill="none"
          stroke={p.light}
          strokeOpacity={0.45}
          strokeWidth={2}
        />
        <path d="M146 270 Q200 226 254 270 Q200 314 146 270 Z" fill={p.light} />
        <circle cx={200} cy={270} r={18} fill={p.ink} />
        <circle cx={194} cy={264} r={5} fill={p.light} />
      </>
    ),
  };
};

const wheel: SceneFn = ({ p, w, h, s, rand }) => {
  const railY = h * 0.92;
  const puffs = Array.from({ length: Math.round(w / (90 * s)) }, (_, i) => (
    <circle
      key={i}
      cx={r1(rand() * w)}
      cy={r1(h * (0.06 + rand() * 0.3))}
      r={r1((30 + rand() * 50) * s)}
    />
  ));
  return {
    field: (
      <>
        <g fill={p.light} opacity={0.1}>
          {puffs}
        </g>
        <rect y={r1(railY)} width={w} height={r1(h - railY)} fill={p.ink} />
        <line x1={0} x2={w} y1={r1(railY)} y2={r1(railY)} stroke={p.accent} strokeWidth={3 * s} />
      </>
    ),
    focal: (
      <>
        <g fill={p.light} opacity={0.2}>
          <circle cx={120} cy={92} r={60} />
          <circle cx={184} cy={60} r={44} />
          <circle cx={60} cy={132} r={50} />
        </g>
        <circle cx={-60} cy={420} r={150} fill="none" stroke={p.ink} strokeWidth={18} />
        <circle cx={210} cy={400} r={150} fill="none" stroke={p.ink} strokeWidth={18} />
        <circle cx={210} cy={400} r={128} fill="none" stroke={p.accent} strokeWidth={4} />
        <path d="M210 400 L 85 470 A 143 143 0 0 1 72 360 Z" fill={p.ink} />
        <g stroke={p.ink} strokeWidth={8}>
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={210}
                y1={400}
                x2={r1(210 + Math.cos(angle) * 142)}
                y2={r1(400 + Math.sin(angle) * 142)}
              />
            );
          })}
        </g>
        <circle cx={210} cy={400} r={26} fill={p.ink} />
        <line
          x1={276}
          y1={356}
          x2={-20}
          y2={372}
          stroke={p.ink}
          strokeWidth={16}
          strokeLinecap="round"
        />
        <circle cx={276} cy={356} r={10} fill={p.accent} />
      </>
    ),
  };
};

const silhouette: SceneFn = ({ p, w, h, s, fx, fy, url, option, rand }) => {
  const domes = option === "domes";
  return {
    field: (
      <>
        <circle cx={fx(200)} cy={fy(domes ? 250 : 170)} r={300 * s} fill={url("glow")} />
        {stars(rand, Math.round((w * h) / 5000), w, h * 0.55, p.light)}
        <rect y={r1(h * 0.86)} width={w} height={r1(h * 0.14)} fill={p.ink} />
      </>
    ),
    focal: domes ? (
      <>
        <g fill={p.ink}>
          <rect x={0} y={470} width={400} height={130} />
          <path d="M110 470 V420 C110 392 140 384 140 362 C140 384 170 392 170 420 V470 Z" />
          <path d="M196 470 V400 C196 362 236 352 236 318 C236 352 276 362 276 400 V470 Z" />
          <rect x={176} y={330} width={10} height={140} />
          <path d="M176 330 L181 306 L186 330 Z" />
          <rect x={290} y={350} width={10} height={120} />
          <path d="M290 350 L295 326 L300 350 Z" />
          <path d="M300 470 V436 C300 420 318 414 318 400 C318 414 336 420 336 436 V470 Z" />
          <path d="M48 470 C52 430 58 400 62 380 L66 380 C64 404 60 432 58 470 Z" />
          <path d="M64 382 C44 372 28 376 18 388 C34 380 50 382 64 388 Z M64 382 C80 366 98 364 110 372 C94 372 80 378 66 388 Z M64 382 C60 362 66 348 76 342 C70 356 70 368 68 384 Z" />
        </g>
        <path
          fillRule="evenodd"
          d="M0 0 H400 V600 H0 Z M70 600 V262 C70 150 140 90 200 58 C260 90 330 150 330 262 V600 Z"
          fill={p.ink}
        />
        <path
          d="M84 600 V264 C84 160 148 106 200 76 C252 106 316 160 316 264 V600"
          fill="none"
          stroke={p.accent}
          strokeWidth={3}
          strokeDasharray="1 9"
          strokeLinecap="round"
        />
        <g fill="none" stroke={p.ink} strokeWidth={2.5} strokeLinecap="round">
          <path d="M150 190 l8 6 l8 -6" />
          <path d="M182 168 l6 5 l6 -5" />
          <path d="M236 206 l7 5 l7 -5" />
        </g>
      </>
    ) : (
      <>
        <g fill={p.ink}>
          <path d="M0 600 V500 C60 470 110 452 150 430 C190 410 230 412 270 430 C320 452 360 470 400 486 V600 Z" />
          <rect x={150} y={300} width={100} height={140} />
          <rect x={128} y={262} width={30} height={178} />
          <polygon points="122,264 143,196 164,264" />
          <rect x={242} y={240} width={34} height={200} />
          <polygon points="236,242 259,160 282,242" />
          <rect x={186} y={250} width={28} height={60} />
          <polygon points="182,252 200,204 218,252" />
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={152 + i * 20} y={290} width={12} height={12} />
          ))}
        </g>
        <g stroke={p.ink} strokeWidth={2}>
          <line x1={143} y1={196} x2={143} y2={176} />
          <line x1={259} y1={160} x2={259} y2={138} />
        </g>
        <g fill={p.accent}>
          <polygon points="143,176 160,181 143,186" />
          <polygon points="259,138 276,143 259,148" />
          <rect x={196} y={330} width={8} height={14} />
          <rect x={252} y={300} width={8} height={14} />
        </g>
        <path
          d="M0 560 C40 548 70 572 110 560 C150 548 180 572 220 560 C260 548 290 572 330 560 C360 552 380 566 400 560 V600 H0 Z"
          fill={p.bg2}
          opacity={0.75}
        />
        <g fill={p.accent}>
          <path d="M96 150 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" />
          <path d="M320 104 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" />
        </g>
      </>
    ),
  };
};

const spiral: SceneFn = ({ p, s, fx, fy }) => {
  let d = "";
  for (let i = 0; i <= 240; i += 1) {
    const t = (i / 240) * Math.PI * 10;
    const radius = 4 + 4.1 * t;
    const x = 200 + Math.cos(t) * radius;
    const y = 280 + Math.sin(t) * radius;
    d += `${i === 0 ? "M" : " L"}${r1(x)} ${r1(y)}`;
  }
  const cx = fx(200);
  const cy = fy(280);
  return {
    field: (
      <g fill="none" stroke={p.light} strokeWidth={s}>
        {Array.from({ length: 14 }, (_, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r1((150 + i * 60) * s)}
            strokeOpacity={r1(0.12 - i * 0.008)}
          />
        ))}
      </g>
    ),
    focal: (
      <>
        <path d={d} fill="none" stroke={p.accent} strokeWidth={3} strokeLinecap="round" />
        <g>
          {[150, 250].map((ex) => (
            <g key={ex}>
              <path
                d={`M${ex - 30} 110 Q${ex} 84 ${ex + 30} 110 Q${ex} 136 ${ex - 30} 110 Z`}
                fill={p.light}
              />
              <circle cx={ex} cy={110} r={11} fill={p.ink} />
              <circle cx={ex - 3} cy={107} r={3} fill={p.light} />
            </g>
          ))}
        </g>
        <g stroke={p.ink} strokeWidth={2.5}>
          {[-24, -8, 8, 24].map((angle, i) => (
            <g key={angle} transform={`rotate(${angle} 200 640)`}>
              <rect
                x={172}
                y={474}
                width={56}
                height={84}
                rx={5}
                fill={i === 3 ? p.light : p.bg2}
              />
            </g>
          ))}
        </g>
        <path
          d="M200 500 L212 516 L200 532 L188 516 Z"
          fill={p.accent}
          transform="rotate(24 200 640)"
        />
      </>
    ),
  };
};

const wings: SceneFn = ({ p, w, h, s, fx, url, rand }) => {
  const flames = Array.from({ length: Math.round(w / (34 * s)) }, (_, i) => {
    const x = rand() * w;
    const fh = (30 + rand() * 60) * s;
    const base = h * 0.92;
    return (
      <path
        key={i}
        d={`M${r1(x - 10 * s)} ${r1(base)} Q${r1(x - 6 * s)} ${r1(base - fh * 0.6)} ${r1(x)} ${r1(base - fh)} Q${r1(x + 6 * s)} ${r1(base - fh * 0.6)} ${r1(x + 10 * s)} ${r1(base)} Z`}
      />
    );
  });
  return {
    field: (
      <>
        <circle cx={fx(200)} cy={h} r={420 * s} fill={url("glow")} />
        <g fill={p.accent} opacity={0.7}>
          {flames}
        </g>
        <rect y={r1(h * 0.92)} width={w} height={r1(h * 0.08)} fill={p.ink} />
      </>
    ),
    focal: (
      <>
        <g fill={p.ink}>
          <path d="M200 150 C150 70 60 40 0 60 L0 380 C20 360 40 380 50 350 C70 340 85 360 100 330 C118 320 130 340 145 305 C160 295 172 310 180 280 Z" />
          <path
            d="M200 150 C150 70 60 40 0 60 L0 380 C20 360 40 380 50 350 C70 340 85 360 100 330 C118 320 130 340 145 305 C160 295 172 310 180 280 Z"
            transform="translate(400 0) scale(-1 1)"
          />
          <circle cx={200} cy={140} r={18} />
          <path d="M188 128 L180 104 L194 122 Z M212 128 L220 104 L206 122 Z" />
          <path d="M184 156 L216 156 L224 300 L176 300 Z" />
          <path d="M0 600 V540 L30 520 L60 540 V510 L90 480 L120 510 V530 L150 505 L175 530 V495 L200 470 L225 495 V520 L255 500 L285 525 V490 L315 465 L345 490 V530 L375 510 L400 530 V600 Z" />
        </g>
        <g fill={p.accent}>
          <circle cx={194} cy={140} r={2.5} />
          <circle cx={206} cy={140} r={2.5} />
          <rect x={84} y={524} width={6} height={9} />
          <rect x={196} y={500} width={6} height={9} />
          <rect x={310} y={500} width={6} height={9} />
        </g>
      </>
    ),
  };
};

const door: SceneFn = ({ p, w, h, s, fx, url }) => {
  const floor = h * (520 / 600);
  const vx = fx(200);
  return {
    field: (
      <>
        <circle cx={vx} cy={floor * 0.6} r={340 * s} fill={url("glow")} />
        <rect y={r1(floor)} width={w} height={r1(h - floor)} fill={p.ink} opacity={0.75} />
        <g stroke={p.accent} strokeOpacity={0.25} strokeWidth={s}>
          {Array.from({ length: 13 }, (_, i) => (
            <line key={i} x1={r1(vx)} y1={r1(floor)} x2={r1(((i - 6) / 6) * w * 0.9 + vx)} y2={h} />
          ))}
        </g>
      </>
    ),
    focal: (
      <>
        <polygon points="90,520 310,520 400,600 0,600" fill={p.light} opacity={0.22} />
        <path d="M90 520 V230 A110 110 0 0 1 310 230 V520 Z" fill={p.light} opacity={0.95} />
        <g fill={p.bg2} fillOpacity={0.55} stroke={p.ink} strokeWidth={4}>
          <polygon points="108,516 160,500 160,250 108,236" />
          <rect x={168} y={244} width={64} height={272} />
          <polygon points="240,500 292,516 292,236 240,250" />
        </g>
        <g stroke={p.accent} strokeWidth={5} strokeLinecap="round">
          <line x1={116} y1={384} x2={152} y2={378} />
          <line x1={178} y1={380} x2={222} y2={380} />
          <line x1={248} y1={378} x2={284} y2={384} />
        </g>
        <path
          d="M90 520 V230 A110 110 0 0 1 310 230 V520"
          fill="none"
          stroke={p.ink}
          strokeWidth={10}
        />
        <g fill={p.ink}>
          <path d="M36 382 h30 v-6 c0 -8 -30 -8 -30 0 Z" />
          <rect x={32} y={381} width={38} height={5} rx={2} />
          <circle cx={51} cy={398} r={10} />
          <path d="M34 410 L68 410 L76 522 L26 522 Z" />
        </g>
        <g fill={p.accent}>
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={51} cy={424 + i * 15} r={2.6} />
          ))}
          <rect x={30} y={410} width={10} height={4} />
          <rect x={62} y={410} width={10} height={4} />
        </g>
      </>
    ),
  };
};

const constructivist: SceneFn = ({ p, w, h, s, fx, fy, option, rand }) => {
  if (option === "beams") {
    const ox = fx(200);
    const oy = h;
    const beams = Array.from({ length: 13 }, (_, i) => {
      const spread = w * 1.6;
      const x0 = ox - spread / 2 + (i / 13) * spread;
      const x1 = x0 + spread / 26;
      return <polygon key={i} points={`${r1(ox)},${oy} ${r1(x0)},0 ${r1(x1)},0`} />;
    });
    const crowd: ReactNode[] = [];
    for (let i = 0; i < 46; i += 1) {
      const x = rand() * 420 - 10;
      const y = 560 + rand() * 44;
      crowd.push(figure(x, y, 26 + rand() * 10, p.ink, i));
    }
    return {
      field: (
        <>
          <g fill={p.accent} opacity={0.22}>
            {beams}
          </g>
          <rect y={r1(h * 0.94)} width={w} height={r1(h * 0.06)} fill={p.ink} />
        </>
      ),
      focal: (
        <>
          <rect x={84} y={60} width={7} height={520} fill={p.ink} />
          <path
            d="M91 64 C150 52 200 92 268 74 L262 202 C196 220 148 180 91 194 Z"
            fill={p.accent}
          />
          <g stroke={p.ink} strokeWidth={5} fill="none">
            <path d="M180 600 V420 A60 60 0 0 1 300 420 V600" />
            {[200, 220, 240, 260, 280].map((x) => (
              <line key={x} x1={x} x2={x} y1={392} y2={600} />
            ))}
            <circle cx={240} cy={436} r={14} />
          </g>
          {crowd}
          <g stroke={p.ink} strokeWidth={4} strokeLinecap="round">
            <line x1={120} y1={548} x2={110} y2={512} />
            <line x1={226} y1={552} x2={240} y2={514} />
            <line x1={330} y1={556} x2={322} y2={520} />
          </g>
        </>
      ),
    };
  }

  const smoke = Array.from({ length: Math.round(w / (60 * s)) }, (_, i) => (
    <circle
      key={i}
      cx={r1(rand() * w)}
      cy={r1(h * (0.04 + rand() * 0.22))}
      r={r1((14 + rand() * 30) * s)}
    />
  ));
  return {
    field: (
      <>
        <circle cx={fx(300)} cy={fy(150)} r={110 * s} fill={p.accent} />
        <g fill={p.ink} opacity={0.18}>
          {smoke}
        </g>
        <polygon
          points={`0,${r1(h * 0.62)} ${w},${r1(h * 0.42)} ${w},${r1(h * 0.5)} 0,${r1(h * 0.7)}`}
          fill={p.accent}
          opacity={0.9}
        />
        <rect y={r1(h * 0.9)} width={w} height={r1(h * 0.1)} fill={p.ink} />
      </>
    ),
    focal: (
      <>
        <g fill={p.ink}>
          <rect x={60} y={170} width={34} height={430} />
          <rect x={120} y={110} width={30} height={490} />
          <rect x={316} y={210} width={36} height={390} />
          <path d="M0 600 V430 L50 390 V430 L100 390 V430 L150 390 V430 L200 390 V430 L250 390 V430 L300 390 V430 L350 390 V430 L400 390 V600 Z" />
        </g>
        <g fill={p.ink} opacity={0.85}>
          <circle cx={77} cy={150} r={16} />
          <circle cx={90} cy={122} r={22} />
          <circle cx={135} cy={88} r={18} />
          <circle cx={150} cy={58} r={26} />
        </g>
        <g transform="translate(240 286)">
          <circle r={48} fill="none" stroke={p.ink} strokeWidth={12} />
          <circle r={12} fill={p.ink} />
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x={-7}
              y={-66}
              width={14}
              height={18}
              fill={p.ink}
              transform={`rotate(${i * 30})`}
            />
          ))}
        </g>
      </>
    ),
  };
};

const forest: SceneFn = ({ p, w, h, s, rand }) => {
  const trunks = Array.from({ length: Math.round(w / (34 * s)) }, (_, i) => {
    const x = rand() * w;
    const tw = (8 + rand() * 14) * s;
    return <rect key={i} x={r1(x)} y={0} width={r1(tw)} height={h} />;
  });
  return {
    field: (
      <>
        <g fill={p.ink} opacity={0.45}>
          {trunks}
        </g>
        <g fill={p.light}>
          {[0.58, 0.7, 0.8].map((y, i) => (
            <rect key={y} y={r1(h * y)} width={w} height={r1(h * 0.05)} opacity={0.05 + i * 0.02} />
          ))}
        </g>
        <rect y={r1(h * 0.9)} width={w} height={r1(h * 0.1)} fill={p.ink} opacity={0.8} />
      </>
    ),
    focal: (
      <>
        <g fill={p.light} opacity={0.16}>
          <polygon points="214,0 262,0 336,600 252,600" />
          <polygon points="96,0 124,0 170,600 120,600" />
        </g>
        <g fill={p.ink}>
          <path d="M40 0 H86 L90 600 H34 Z" />
          <path d="M150 0 H206 L212 600 H144 Z" />
          <path d="M300 0 H350 L354 600 H294 Z" />
          <path d="M364 0 H392 L396 600 H360 Z" />
        </g>
        <g fill={p.light} opacity={0.92}>
          <ellipse cx={246} cy={528} rx={24} ry={10} />
          <path d="M266 524 L280 506 L286 510 L274 530 Z" />
          <g stroke={p.light} strokeWidth={3} strokeLinecap="round">
            <line x1={230} y1={534} x2={226} y2={556} />
            <line x1={238} y1={536} x2={240} y2={558} />
            <line x1={256} y1={536} x2={252} y2={558} />
            <line x1={264} y1={534} x2={270} y2={556} />
          </g>
          <path d="M240 520 L244 496 L252 496 L254 520 Z" />
          <circle cx={248} cy={490} r={5} />
        </g>
        <rect
          x={252}
          y={474}
          width={3}
          height={36}
          fill={p.accent}
          transform="rotate(16 252 474)"
        />
      </>
    ),
  };
};

const screen: SceneFn = ({ p, w, h, s, fx, fy }) => {
  const rows: ReactNode[] = [];
  for (let row = 0; row < 3; row += 1) {
    const y = h * (0.82 + row * 0.07);
    const size = (18 + row * 6) * s;
    for (let x = -size, i = 0; x < w + size; x += size * 1.25, i += 1) {
      rows.push(
        <rect
          key={`${row}-${i}`}
          x={r1(x)}
          y={r1(y)}
          width={r1(size)}
          height={r1(size * 1.4)}
          rx={r1(size * 0.3)}
        />,
      );
    }
  }
  return {
    field: (
      <>
        <polygon
          points={`${r1(w * 0.98)},${r1(h * 0.02)} ${r1(fx(70))},${r1(fy(110))} ${r1(fx(70))},${r1(fy(300))} ${r1(fx(330))},${r1(fy(300))}`}
          fill={p.light}
          opacity={0.08}
        />
        <g fill={p.ink}>{rows}</g>
      </>
    ),
    focal: (
      <>
        <path d="M20 80 C40 200 30 330 44 420 L20 420 Z" fill={p.bg2} />
        <path d="M380 80 C360 200 370 330 356 420 L380 420 Z" fill={p.bg2} />
        <rect x={20} y={70} width={360} height={22} fill={p.bg2} />
        <rect x={64} y={110} width={272} height={196} fill={p.light} opacity={0.95} />
        <g stroke={p.ink} strokeWidth={3} fill="none" opacity={0.75}>
          <rect x={226} y={170} width={50} height={110} />
          <line x1={64} y1={280} x2={336} y2={280} />
          <path d="M96 280 V214 L132 186 L168 214 V280" />
        </g>
        <g fill={p.ink}>
          <rect x={176} y={220} width={36} height={6} rx={2} />
          <rect x={186} y={210} width={16} height={12} rx={2} />
          <circle cx={194} cy={234} r={8} />
          <path d="M184 242 h20 l4 50 h-12 l-2 -24 l-2 24 h-12 Z" />
          <path d="M206 254 l18 18 l-4 4 l-16 -14 Z" />
        </g>
        <rect x={64} y={306} width={272} height={8} fill={p.accent} opacity={0.6} />
      </>
    ),
  };
};

const eye: SceneFn = ({ p, w, h, s, fx, fy }) => {
  const cx = fx(200);
  const cy = fy(280);
  return {
    field: (
      <>
        <g stroke={p.ink} strokeOpacity={0.18} strokeWidth={s}>
          <line x1={0} x2={w} y1={r1(cy)} y2={r1(cy)} />
          <line x1={r1(cx)} x2={r1(cx)} y1={0} y2={h} />
        </g>
        <g fill="none" stroke={p.ink} strokeOpacity={0.12} strokeWidth={s}>
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={r1(cx)} cy={r1(cy)} r={r1((210 + i * 70) * s)} />
          ))}
        </g>
        <polygon
          points={`0,${r1(h * 0.8)} ${w},${r1(h * 0.69)} ${w},${r1(h * 0.74)} 0,${r1(h * 0.85)}`}
          fill={p.accent}
        />
      </>
    ),
    focal: (
      <>
        <path
          d="M40 280 Q200 120 360 280 Q200 440 40 280 Z"
          fill={p.light}
          stroke={p.ink}
          strokeWidth={8}
        />
        <circle cx={200} cy={280} r={78} fill={p.ink} />
        <circle cx={200} cy={280} r={60} fill="none" stroke={p.accent} strokeWidth={6} />
        <circle cx={200} cy={268} r={17} fill={p.light} />
        <path d="M191 276 L209 276 L218 314 L182 314 Z" fill={p.light} />
        <g stroke={p.ink} strokeWidth={5} strokeLinecap="round">
          {[-60, -30, 0, 30, 60].map((dx) => (
            <line
              key={dx}
              x1={200 + dx}
              y1={r1(200 + Math.abs(dx) * 0.36)}
              x2={200 + dx * 1.15}
              y2={r1(176 + Math.abs(dx) * 0.4)}
            />
          ))}
        </g>
      </>
    ),
  };
};

const horizon: SceneFn = ({ p, w, h, s, url }) => {
  const line = h * 0.62;
  return {
    field: (
      <>
        <circle cx={r1(w * 0.18)} cy={r1(line)} r={r1(220 * s)} fill={url("glow")} />
        <circle
          cx={r1(w * 0.18)}
          cy={r1(line - 8 * s)}
          r={r1(26 * s)}
          fill={p.accent}
          opacity={0.55}
        />
        <rect y={r1(line)} width={w} height={r1(h - line)} fill={p.light} />
        <line
          x1={0}
          x2={w}
          y1={r1(line)}
          y2={r1(line)}
          stroke={p.ink}
          strokeOpacity={0.5}
          strokeWidth={1.5 * s}
        />
        <g stroke={p.accent} strokeOpacity={0.35} strokeWidth={1.5 * s} strokeLinecap="round">
          {Array.from({ length: 8 }, (_, i) => (
            <line
              key={i}
              x1={r1((((i * 37) % 100) / 100) * w)}
              x2={r1((((i * 37) % 100) / 100) * w + 120 * s)}
              y1={r1(line + (20 + i * 22) * s)}
              y2={r1(line + (20 + i * 22) * s)}
            />
          ))}
        </g>
      </>
    ),
    focal: (
      <>
        <path
          d="M110 520 A90 76 0 0 1 290 520 Z"
          fill={p.light}
          stroke={p.accent}
          strokeWidth={3}
        />
        <g fill="none" stroke={p.accent} strokeWidth={2} opacity={0.75}>
          <path d="M122 494 Q200 470 278 494" />
          <path d="M140 470 Q200 452 260 470" />
          <path d="M164 452 Q200 442 236 452" />
          {[150, 190, 230, 266].map((x) => (
            <line key={x} x1={x} x2={x} y1={496} y2={520} />
          ))}
          {[170, 206, 244].map((x) => (
            <line key={x} x1={x} x2={x} y1={472} y2={492} />
          ))}
        </g>
        <path
          d="M176 520 A32 28 0 0 1 240 520 Z"
          fill={p.light}
          stroke={p.accent}
          strokeWidth={3}
        />
        <path d="M194 520 A14 14 0 0 1 222 520 Z" fill={p.ink} />
        <g fill={p.ink}>
          <circle cx={330} cy={466} r={9} />
          <path d="M318 476 C320 470 340 470 342 476 L348 524 L312 524 Z" />
        </g>
        <line
          x1={352}
          y1={420}
          x2={334}
          y2={530}
          stroke={p.ink}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </>
    ),
  };
};

const fields: SceneFn = ({ p, w, h, s, fx, url, rand }) => {
  const line = h * 0.55;
  const vx = fx(200);
  const stalks = Array.from({ length: Math.round(w / (12 * s)) }, (_, i) => {
    const x = rand() * w;
    const sh = (90 + rand() * 120) * s;
    const lean = (rand() - 0.5) * 30 * s;
    return (
      <g key={i}>
        <path
          d={`M${r1(x)} ${h} Q${r1(x + lean * 0.4)} ${r1(h - sh * 0.5)} ${r1(x + lean)} ${r1(h - sh)}`}
        />
        <ellipse
          cx={r1(x + lean)}
          cy={r1(h - sh - 6 * s)}
          rx={r1(3 * s)}
          ry={r1(10 * s)}
          fill={p.accent}
          stroke="none"
        />
      </g>
    );
  });
  return {
    field: (
      <>
        <circle cx={r1(vx)} cy={r1(line)} r={r1(360 * s)} fill={url("glow")} />
        <rect y={r1(line)} width={w} height={r1(h - line)} fill={p.bg2} />
        <g stroke={p.ink} strokeOpacity={0.22} strokeWidth={2 * s}>
          {Array.from({ length: 17 }, (_, i) => (
            <line key={i} x1={r1(vx)} y1={r1(line)} x2={r1(((i - 8) / 8) * w * 1.1 + vx)} y2={h} />
          ))}
        </g>
        <g fill="none" stroke={p.ink} strokeOpacity={0.55} strokeWidth={1.5 * s}>
          {stalks}
        </g>
      </>
    ),
    focal: (
      <>
        <g fill={p.ink}>
          <rect x={236} y={300} width={44} height={30} />
          <polygon points="230,302 258,280 286,302" />
          <rect x={290} y={292} width={30} height={38} />
          <polygon points="286,294 305,272 324,294" />
          <rect x={132} y={250} width={4} height={80} />
        </g>
        <g stroke={p.ink} strokeWidth={2} fill="none">
          <line x1={124} y1={330} x2={134} y2={258} />
          <line x1={144} y1={330} x2={134} y2={258} />
          <circle cx={134} cy={250} r={14} />
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={134}
                y1={250}
                x2={r1(134 + Math.cos(angle) * 14)}
                y2={r1(250 + Math.sin(angle) * 14)}
              />
            );
          })}
        </g>
        <rect x={0} y={330} width={400} height={2} fill={p.ink} opacity={0.4} />
        <circle cx={200} cy={160} r={44} fill={p.light} opacity={0.85} />
      </>
    ),
  };
};

export const SCENES: Readonly<Record<ArtMotif, SceneFn>> = {
  sun,
  moon,
  shadow,
  tower,
  steps,
  shards,
  lens,
  wheel,
  silhouette,
  spiral,
  wings,
  door,
  constructivist,
  forest,
  screen,
  eye,
  horizon,
  fields,
};
