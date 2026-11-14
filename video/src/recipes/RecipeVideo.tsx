import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, Waves } from "../LogoAnimation";
import { fontFamily } from "../font";
import { Chef, type ChefMood, type HandPose } from "./Chef";
import { GROUPS, PanStage, panHandleEnd } from "./PanStage";
import { PlateStage } from "./PlateStage";
import { TrayStage } from "./TrayStage";
import {
  BreadcrumbsIcon,
  FishIcon,
  GarlicClove,
  IngredientIcon,
  LemonHalf,
  LinguineBundle,
  OilBottle,
  ParsleySprig,
  SaltPepper,
  Shrimp,
  TomatoWhole,
  ZucchiniWhole,
} from "./ingredients";
import { ROW_GAP, recipeTimeline, type IconKind, type Recipe } from "./types";
import { clamp, lerpPt, stageMotion, type Pt } from "./utils";

// Video-ricetta: logo, lista ingredienti, preparazione animata con il cuoco,
// impiattamento e saluto finale. La ricetta arriva come dati (vedi types.ts).

const CHEF = { x: 228, y: 1300, s: 1.0 };
const TEXT_COL = { left: 485, right: 30, top: 1230 };

const ICONS: Record<IconKind, React.ReactNode> = {
  linguine: <LinguineBundle />,
  shrimp: (
    <g transform="scale(1.25)">
      <Shrimp cooked={1} />
    </g>
  ),
  zucchiniWhole: <ZucchiniWhole />,
  tomatoWhole: <TomatoWhole />,
  garlicClove: <GarlicClove />,
  oilBottle: <OilBottle />,
  parsleySprig: <ParsleySprig />,
  lemon: <LemonHalf r={34} />,
  saltPepper: <SaltPepper />,
  orata: <FishIcon />,
  breadcrumbs: <BreadcrumbsIcon />,
};

export const RecipeVideo: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = useMemo(() => recipeTimeline(recipe), [recipe]);
  const motion = stageMotion(frame, fps, tl);
  const plateAt = tl.plateAt ?? Infinity;
  const oven = tl.ovenStep;
  const isPan = recipe.vessel === "pan";

  // --- scena 1: titolo e ingredienti
  const titleIn = interpolate(frame, [12, 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const listOut = interpolate(frame, [tl.listOut, tl.listOut + 20], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const cardIn = interpolate(frame, [36, 58], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  // --- cuoco
  const chefIn = spring({ frame: frame - tl.stageIn - 6, fps, config: { damping: 14 } });
  const chefSlide = (1 - chefIn) * 500;
  const allAdds = tl.steps.flatMap((s) => s.adds);
  // gesto di "lancio" a ogni ingrediente
  let gesture = 0;
  for (const a of allAdds) {
    const tt = frame - a.at + 6;
    if (tt >= 0 && tt < 24) gesture = Math.max(gesture, Math.sin((tt / 24) * Math.PI));
  }
  const inOutro = frame >= tl.outro + 10;
  const waveAmt = interpolate(frame, [tl.outro + 10, tl.outro + 25], [0, 1], clamp);
  const thumbsUp = frame >= tl.outro + 62;
  const waveX = thumbsUp ? 0 : waveAmt * Math.sin((frame - tl.outro) * 0.35) * 26;

  // mano sinistra: sulla pancia; in padella lancia gli ingredienti; nel finale saluta
  const restL = { x: -70, y: 236 };
  const upL = { x: -150, y: -70 };
  const leftBase = lerpPt(restL, upL, Math.max(isPan ? gesture : 0, waveAmt));
  const leftHand = { x: leftBase.x + waveX, y: leftBase.y };

  // mano destra: tiene la padella, oppure presenta la teglia e il piatto
  const present = { x: 172, y: -92 };
  let rightHand: Pt;
  let rightPose: HandPose = "open";
  let rightAnchored = false;
  if (isPan) {
    const grip = {
      x: (panHandleEnd.x + motion.offset.x - 6 - (CHEF.x - chefSlide)) / CHEF.s,
      y: (panHandleEnd.y + motion.offset.y - 4 - CHEF.y) / CHEF.s,
    };
    const release = interpolate(frame, [plateAt + 2, plateAt + 14], [0, 1], clamp);
    rightHand = lerpPt(grip, present, release);
    rightPose = frame < plateAt + 5 ? "grip" : "open";
    rightAnchored = frame < plateAt + 8;
  } else {
    const restR = { x: 70, y: 236 };
    const throwUp = { x: 188, y: -176 };
    // mentre il forno lavora aspetta con le mani sulla pancia
    const waiting = oven
      ? interpolate(frame, [oven.start, oven.start + 14, oven.end - 24, oven.end - 10], [0, 1, 1, 0], clamp)
      : 0;
    rightHand = lerpPt(lerpPt(present, restR, waiting), throwUp, gesture);
  }

  const blinkPhase = frame % 96;
  const blink = blinkPhase < 6 ? Math.sin((blinkPhase / 6) * Math.PI) : 0;
  const wow = Math.abs(motion.tossAmt) > 0.15;
  // guarda la padella, ogni tanto dà un'occhiata a chi guarda il video
  const atPan = inOutro ? 0 : interpolate(frame % 150, [112, 117, 140, 145], [1, 0, 0, 1], clamp);
  const look = { x: 0.95 * atPan, y: -0.75 * atPan };
  // alla fine della cottura chiude gli occhi e si gode il profumo
  const lastCook = [...tl.steps].reverse().find((s) => !s.plate) ?? null;
  const savoring = lastCook !== null && frame > lastCook.end - 44 && frame < lastCook.end;
  let mood: ChefMood = "neutral";
  if (gesture > 0.25) mood = "smile";
  if (frame >= plateAt + 30 && frame < tl.outro) mood = "smile";
  if (savoring) mood = "happy";
  if (wow) mood = "wow";
  if (inOutro) mood = thumbsUp ? "wink" : "happy";
  const brow = gesture * 5 + (wow ? 8 : 0);
  const bob = Math.sin(frame / 12) * 4;
  const headTilt =
    motion.tossAmt * 5 +
    Math.sin(frame / 40) * 1.2 +
    (inOutro ? Math.sin((frame - tl.outro) / 9) * 3 : 0) +
    (savoring ? -4 : 0);
  const wiggle = mood === "happy" || mood === "wink" ? Math.sin(frame / 3) * 2.5 : 0;

  // --- didascalia
  const current = tl.steps.findIndex((s) => frame >= s.start && frame < s.end);
  const step = current >= 0 ? tl.steps[current] : null;
  const capIn = step
    ? interpolate(frame - step.start, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
    : 0;
  const capOut =
    step && current < tl.steps.length - 1
      ? interpolate(frame, [step.end - 8, step.end], [1, 0], clamp)
      : interpolate(frame, [tl.outro, tl.outro + 12], [1, 0], clamp);

  const outroText = (d: number) =>
    interpolate(frame, [tl.outro + d, tl.outro + d + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pill = spring({ frame: frame - tl.outro - 45, fps, config: { damping: 13 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream, fontFamily }}>
      <Waves />

      {/* Logo in alto */}
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          opacity: interpolate(frame, [0, 18], [0, 1], clamp),
        }}
      >
        <Img src={staticFile("logo/fish.png")} style={{ width: 280 }} />
        <Img src={staticFile("logo/sapore.png")} style={{ width: 360 }} />
      </div>

      {/* Scena 1: titolo + ingredienti */}
      <AbsoluteFill style={{ opacity: 1 - listOut, transform: `translateY(${-listOut * 60}px)` }}>
        <div
          style={{
            position: "absolute",
            top: 312,
            width: "100%",
            textAlign: "center",
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 30}px)`,
          }}
        >
          <div style={{ color: COLORS.blue, fontSize: 30, fontWeight: 600, letterSpacing: 9 }}>LA RICETTA</div>
          {recipe.title.map((l) => (
            <div key={l} style={{ color: COLORS.slate, fontSize: 70, fontWeight: 600, lineHeight: 1.12 }}>
              {l}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            top: 560,
            left: 60,
            right: 60,
            padding: "30px 44px 22px",
            borderRadius: 40,
            backgroundColor: "rgba(58,150,191,0.08)",
            opacity: cardIn,
            transform: `translateY(${(1 - cardIn) * 40}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ color: COLORS.blue, fontSize: 32, fontWeight: 600, letterSpacing: 6 }}>INGREDIENTI</div>
            <div style={{ color: COLORS.slate, fontSize: 30, opacity: 0.75 }}>{recipe.servings}</div>
          </div>
          {recipe.ingredients.map((ing, i) => {
            const p = spring({ frame: frame - tl.rowsStart - i * ROW_GAP, fps, config: { damping: 15 } });
            return (
              <div
                key={ing.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 106,
                  gap: 26,
                  opacity: Math.min(1, p * 1.4),
                  transform: `translateX(${(1 - p) * -70}px)`,
                  borderTop: i ? "2px solid rgba(58,150,191,0.15)" : undefined,
                }}
              >
                <IngredientIcon size={84}>{ICONS[ing.icon]}</IngredientIcon>
                <div style={{ flex: 1, color: COLORS.slate, fontSize: 40, fontWeight: 500 }}>{ing.name}</div>
                <div style={{ color: COLORS.deepBlue, fontSize: 40, fontWeight: 600 }}>{ing.qty}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* Scena 2: titolo piccolo */}
      <div
        style={{
          position: "absolute",
          top: 312,
          width: "100%",
          textAlign: "center",
          color: COLORS.deepBlue,
          fontSize: 34,
          fontWeight: 500,
          opacity: interpolate(frame, [tl.listOut + 15, tl.listOut + 35], [0, 1], clamp),
        }}
      >
        {recipe.title.join(" ")}
      </div>

      {/* Padella o teglia, piatto e cuoco */}
      {frame >= tl.stageIn && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="steamBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={9} />
            </filter>
          </defs>

          {motion.exit < 1 &&
            (isPan ? (
              <PanStage
                recipe={recipe}
                tl={tl}
                frame={frame}
                fps={fps}
                offset={motion.offset}
                tossAmt={motion.tossAmt}
              />
            ) : (
              <TrayStage tl={tl} frame={frame} fps={fps} offset={motion.offset} />
            ))}

          {tl.plateAt !== null && <PlateStage dish={recipe.dish} frame={frame} fps={fps} at={tl.plateAt} />}

          <g
            transform={`translate(${CHEF.x - chefSlide} ${CHEF.y}) scale(${CHEF.s})`}
            opacity={Math.min(1, chefIn * 1.5)}
          >
            <Chef
              rightHand={rightHand}
              rightPose={rightPose}
              rightAnchored={rightAnchored}
              leftHand={leftHand}
              leftPose={thumbsUp ? "thumb" : "open"}
              mood={mood}
              blink={blink}
              look={look}
              brow={brow}
              tilt={headTilt}
              bob={bob / CHEF.s}
              squash={motion.tossAmt * 0.025}
              hatDy={-Math.abs(motion.tossAmt) * 9}
              wiggle={wiggle}
            />
          </g>
        </svg>
      )}

      {/* Didascalia del passo, a destra del cuoco */}
      {step && (
        <div
          style={{
            position: "absolute",
            top: TEXT_COL.top,
            left: TEXT_COL.left,
            right: TEXT_COL.right,
            opacity: capIn * capOut,
            transform: `translateY(${(1 - capIn) * 30}px)`,
          }}
        >
          <div style={{ color: COLORS.blue, fontSize: 26, fontWeight: 600, letterSpacing: 5 }}>
            PASSO {current + 1} DI {tl.steps.length}
          </div>
          <div style={{ color: COLORS.slate, fontSize: 60, fontWeight: 600, marginTop: 6, lineHeight: 1.1 }}>
            {step.title}
          </div>
          <div style={{ color: COLORS.slate, fontSize: 36, opacity: 0.85, marginTop: 12, lineHeight: 1.3 }}>
            {step.text}
          </div>
        </div>
      )}
      {frame >= tl.stepsStart && frame < tl.outro + 12 && (
        <div
          style={{
            position: "absolute",
            top: 1620,
            left: TEXT_COL.left,
            display: "flex",
            gap: 12,
            opacity: interpolate(frame, [tl.outro, tl.outro + 12], [1, 0], clamp),
          }}
        >
          {tl.steps.map((s, i) => (
            <div
              key={i}
              style={{
                width: i === current ? 36 : 13,
                height: 13,
                borderRadius: 7,
                backgroundColor: i <= current ? COLORS.blue : "rgba(58,150,191,0.25)",
              }}
            />
          ))}
        </div>
      )}

      {/* Finale */}
      {frame >= tl.outro && (
        <div style={{ position: "absolute", top: TEXT_COL.top, left: TEXT_COL.left, right: TEXT_COL.right }}>
          <div
            style={{
              color: COLORS.slate,
              fontSize: 70,
              fontWeight: 600,
              lineHeight: 1.05,
              opacity: outroText(14),
              transform: `translateY(${(1 - outroText(14)) * 30}px)`,
            }}
          >
            Buon appetito!
          </div>
          <div style={{ color: COLORS.blue, fontSize: 36, fontWeight: 500, marginTop: 16, opacity: outroText(30) }}>
            {recipe.outro}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 36,
              padding: "22px 36px",
              borderRadius: 999,
              backgroundColor: COLORS.blue,
              color: COLORS.cream,
              fontSize: 34,
              fontWeight: 600,
              opacity: Math.min(1, pill * 1.5),
              transform: `scale(${pill})`,
              transformOrigin: "left center",
              boxShadow: "0 12px 30px rgba(31,120,168,0.25)",
            }}
          >
            saporedimareraffadali.it
          </div>
        </div>
      )}

      <RecipeSounds recipe={recipe} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- suoni

const MASTER = 1.5;
const NOTES = ["note-d5", "note-fs5", "note-a5", "note-d5", "note-fs5", "note-a5", "note-b5", "note-d6", "note-b5"];

type Cue = { from: number; file: string; volume: number };

const RecipeSounds: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const tl = recipeTimeline(recipe);
  const cues: Cue[] = [];
  const add = (from: number, file: string, volume: number) => cues.push({ from: Math.round(from), file, volume });

  add(14, "pop", 0.45);
  recipe.ingredients.forEach((_, i) => add(tl.rowsStart + i * ROW_GAP + 2, NOTES[i % NOTES.length], 0.28));
  add(tl.stageIn + 10, "plop", 0.6);

  let sizzleFrom: number | null = null;
  const sizzleTo = tl.plateAt ?? tl.outro + 20;
  for (const s of tl.steps) {
    for (const a of s.adds) {
      const g = GROUPS[a.kind];
      if (a.kind === "oil") {
        sizzleFrom = a.at + 22;
        add(a.at + 20, "sizzle-burst", 0.45);
      } else if (g) {
        const every = Math.max(3, Math.ceil(g.count / 4));
        for (let i = 0; i < g.count; i += every) add(a.at + i * g.stagger + 6, "plop", 0.3);
        add(a.at + 6, "sizzle-burst", 0.55);
      } else if (a.kind === "pasta") {
        add(a.at + 7, "plop", 0.45);
        add(a.at + 9, "sizzle-burst", 0.5);
      } else if (a.kind === "salt" || a.kind === "parsley") {
        add(a.at, "sprinkle", 0.55);
      } else if (a.kind === "lemon") {
        add(a.at + 22, "squeeze", 0.6);
        add(a.at + 42, "sizzle-burst", 0.3);
      } else if (a.kind === "drizzle") {
        add(a.at, "pour", 0.5);
      } else if (a.kind === "fish") {
        add(a.at + 8, "plop", 0.6);
        add(a.at + 22, "plop", 0.6);
      } else if (a.kind === "lemonSlices") {
        add(a.at + 6, "plop", 0.3);
        add(a.at + 18, "plop", 0.3);
      } else if (a.kind === "breadcrumbs") {
        add(a.at, "sprinkle", 0.6);
        add(a.at + 22, "sprinkle", 0.5);
      }
    }
    if (s.tossAt !== null) {
      add(s.tossAt, "sizzle-burst", 0.5);
      add(s.tossAt + 2, "plop", 0.25);
    }
    if (s.oven) {
      add(s.start + 16, "plop", 0.5); // lo sportello si chiude
      for (let f = s.start + 30; f < s.end - 40; f += 9) add(f, "tick", 0.3); // timer
      add(s.end - 36, "pop", 0.55); // pronto!
      add(s.end - 34, "note-a5", 0.4);
      add(s.end - 28, "note-d6", 0.4);
      add(s.end - 14, "sizzle-burst", 0.35); // teglia calda
    }
    if (s.plate) {
      add(s.start + 22, "pop", 0.5); // arriva il piatto
      add(s.start + 38, "plop", recipe.dish === "fish" ? 0.6 : 0.45);
      add(s.start + 62, "plop", 0.3);
      add(s.start + 72, "plop", 0.3);
      add(s.start + 92, "sprinkle", 0.5);
      add(s.start + 106, "note-d5", 0.3);
      add(s.start + 110, "note-fs5", 0.3);
      add(s.start + 114, "note-a5", 0.3);
    }
  }
  add(tl.outro + 14, "note-b5", 0.35);
  add(tl.outro + 45, "pop", 0.5);

  const oven = tl.ovenStep;

  return (
    <>
      {sizzleFrom !== null && (
        <Sequence from={sizzleFrom} durationInFrames={sizzleTo - sizzleFrom + 16} name="SFX sizzle (padella)">
          <Audio
            src={staticFile("sfx/sizzle.wav")}
            loop
            volume={(f) =>
              interpolate(
                f + sizzleFrom!,
                [sizzleFrom!, sizzleFrom! + 20, sizzleTo - 4, sizzleTo + 14],
                [0, 0.35 * MASTER, 0.35 * MASTER, 0],
                clamp,
              )
            }
          />
        </Sequence>
      )}
      {/* in teglia non c'è lo sfrigolio: il mare in sottofondo evita i silenzi */}
      {recipe.vessel === "tray" && (
        <Audio
          src={staticFile("sfx/ocean.wav")}
          loop
          volume={(f) => interpolate(f, [0, 30, tl.total - 45, tl.total], [0, 0.2 * MASTER, 0.2 * MASTER, 0], clamp)}
        />
      )}
      {oven && (
        <Sequence from={oven.start + 18} durationInFrames={oven.duration - 40} name="SFX forno">
          <Audio
            src={staticFile("sfx/oven-hum.wav")}
            loop
            volume={(f) =>
              interpolate(f, [0, 14, oven.duration - 58, oven.duration - 42], [0, 0.28 * MASTER, 0.28 * MASTER, 0], clamp)
            }
          />
        </Sequence>
      )}
      {cues.map((c, i) => (
        <Sequence key={i} from={c.from} name={`SFX ${c.file}`} layout="none">
          <Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.volume * MASTER} />
        </Sequence>
      ))}
    </>
  );
};
