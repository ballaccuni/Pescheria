// Tipi e tempi condivisi da tutte le ricette animate.

export type AddKind =
  // padella
  | "oil"
  | "garlic"
  | "zucchini"
  | "zucchiniSticks"
  | "tomato"
  | "shrimp"
  | "salt"
  | "pasta"
  | "parsley"
  | "lemon"
  | "lemonZest"
  | "mussels"
  | "transfer"
  | "shell"
  | "cream"
  | "paccheri"
  // pentola
  | "potatoes"
  // mixer
  | "blend"
  // teglia
  | "drizzle"
  | "fish"
  | "lemonSlices"
  | "breadcrumbs";

export type IconKind =
  | "linguine"
  | "shrimp"
  | "zucchiniWhole"
  | "tomatoWhole"
  | "garlicClove"
  | "oilBottle"
  | "parsleySprig"
  | "lemon"
  | "saltPepper"
  | "orata"
  | "fillet"
  | "breadcrumbs"
  | "potato"
  | "mussel"
  | "paccheri";

/** Dove si svolge un passo. Il piatto è a parte (plate: true). */
export type StageKind = "pan" | "tray" | "pot" | "mixer" | "bowl";

export type Step = {
  title: string;
  text: string;
  duration: number;
  /** ingredienti che entrano in questo passo */
  add?: AddKind[];
  /** dove si svolge (se manca: recipe.vessel) */
  stage?: StageKind;
  /** salto in padella */
  toss?: boolean;
  /** fotogrammi dall'inizio del passo al salto in padella */
  tossDelay?: number;
  /** cottura in forno */
  oven?: { temp: number; minutes: number };
  /** impiattamento */
  plate?: boolean;
};

export type Recipe = {
  /** dove si cucina */
  vessel: StageKind;
  /** cosa va nel piatto all'impiattamento */
  dish: "pasta" | "fish" | "cozze";
  title: string[];
  servings: string;
  ingredients: { name: string; qty: string; icon: IconKind }[];
  steps: Step[];
  outro: string;
};

export type Segment = {
  kind: StageKind | "plate";
  start: number;
  end: number;
  /** indici dei passi */
  steps: number[];
  /** quando entra in scena */
  enterAt: number;
  /** ultima scena: non esce */
  last: boolean;
};

export const ROW_GAP = 14;
export const TOSS_DELAY = 55;
const LIST_HOLD = 120;
const OUTRO_LEN = 150;

export const recipeTimeline = (recipe: Recipe) => {
  const rowsStart = 60;
  const listOut = rowsStart + recipe.ingredients.length * ROW_GAP + LIST_HOLD;
  const stageIn = listOut + 8;
  const stepsStart = listOut + 40;
  let t = stepsStart;
  const steps = recipe.steps.map((s) => {
    const start = t;
    t += s.duration;
    const adds = (s.add ?? []).map((kind, i) => ({ kind, at: start + 8 + i * 40 }));
    return { ...s, start, end: t, adds, tossAt: s.toss ? start + (s.tossDelay ?? TOSS_DELAY) : null };
  });
  // passi consecutivi nello stesso posto formano una "scena"
  const segments: Segment[] = [];
  steps.forEach((s, i) => {
    const kind: Segment["kind"] = s.plate ? "plate" : (s.stage ?? recipe.vessel);
    const last = segments[segments.length - 1];
    if (last && last.kind === kind) {
      last.end = s.end;
      last.steps.push(i);
    } else {
      segments.push({ kind, start: s.start, end: s.end, steps: [i], enterAt: segments.length ? s.start + 8 : stageIn, last: false });
    }
  });
  if (segments.length) segments[segments.length - 1].last = true;
  const outro = t;
  const plateStep = steps.find((s) => s.plate) ?? null;
  const ovenStep = steps.find((s) => s.oven) ?? null;
  return {
    rowsStart,
    listOut,
    stageIn,
    stepsStart,
    steps,
    outro,
    plateAt: plateStep ? plateStep.start : null,
    ovenStep,
    segments,
    total: outro + OUTRO_LEN,
  };
};

export type Timeline = ReturnType<typeof recipeTimeline>;

/** Tutti i momenti in cui entra un certo ingrediente. */
export const addTimes = (tl: Timeline, kind: AddKind) =>
  tl.steps.flatMap((s) => s.adds.filter((a) => a.kind === kind).map((a) => a.at));

export const firstAdd = (tl: Timeline, kind: AddKind): number | null => addTimes(tl, kind)[0] ?? null;

/** Primo momento in cui entra un ingrediente, dentro un intervallo di tempo. */
export const firstAddIn = (tl: Timeline, kind: AddKind, from: number, to: number): number | null =>
  addTimes(tl, kind).find((t) => t >= from && t < to) ?? null;
