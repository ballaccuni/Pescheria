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
  | "breadcrumbs";

export type Step = {
  title: string;
  text: string;
  duration: number;
  /** ingredienti che entrano in questo passo */
  add?: AddKind[];
  /** salto in padella */
  toss?: boolean;
  /** cottura in forno */
  oven?: { temp: number; minutes: number };
  /** impiattamento */
  plate?: boolean;
};

export type Recipe = {
  /** dove si cucina */
  vessel: "pan" | "tray";
  /** cosa va nel piatto all'impiattamento */
  dish: "pasta" | "fish";
  title: string[];
  servings: string;
  ingredients: { name: string; qty: string; icon: IconKind }[];
  steps: Step[];
  outro: string;
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
    return { ...s, start, end: t, adds, tossAt: s.toss ? start + TOSS_DELAY : null };
  });
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
    total: outro + OUTRO_LEN,
  };
};

export type Timeline = ReturnType<typeof recipeTimeline>;

/** Tutti i momenti in cui entra un certo ingrediente. */
export const addTimes = (tl: Timeline, kind: AddKind) =>
  tl.steps.flatMap((s) => s.adds.filter((a) => a.kind === kind).map((a) => a.at));

export const firstAdd = (tl: Timeline, kind: AddKind): number | null => addTimes(tl, kind)[0] ?? null;
