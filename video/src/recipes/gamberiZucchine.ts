import type { Recipe } from "./RecipeVideo";

export const gamberiZucchine: Recipe = {
  title: ["Linguine con gamberi,", "zucchine e pomodorini"],
  servings: "per 2 persone",
  ingredients: [
    { name: "Linguine", qty: "200 g", icon: "linguine" },
    { name: "Gamberi", qty: "400 g", icon: "shrimp" },
    { name: "Zucchine", qty: "2 medie", icon: "zucchiniWhole" },
    { name: "Pomodorini ciliegino", qty: "200 g", icon: "tomatoWhole" },
    { name: "Aglio", qty: "1 spicchio", icon: "garlicClove" },
    { name: "Olio extravergine", qty: "3 cucchiai", icon: "oilBottle" },
    { name: "Prezzemolo", qty: "q.b.", icon: "parsleySprig" },
    { name: "Limone", qty: "½", icon: "lemon" },
    { name: "Sale e pepe", qty: "q.b.", icon: "saltPepper" },
  ],
  steps: [
    {
      title: "Olio e aglio",
      text: "Scalda l'olio in padella e fai dorare l'aglio a fettine",
      add: ["oil", "garlic"],
      duration: 100,
    },
    {
      title: "Zucchine",
      text: "Aggiungi le zucchine tagliate alla julienne e cuoci per 3-4 minuti",
      add: ["zucchiniSticks"],
      duration: 85,
      toss: true,
    },
    {
      title: "Pomodorini",
      text: "Unisci i ciliegini tagliati a metà e cuoci per 3 minuti",
      add: ["tomato"],
      duration: 85,
    },
    {
      title: "Gamberi",
      text: "Aggiungi i gamberi sgusciati: 2-3 minuti finché diventano rosa",
      add: ["shrimp"],
      duration: 110,
      toss: true,
    },
    {
      title: "Sale e pepe",
      text: "Aggiusta di sale e pepe",
      add: ["salt"],
      duration: 60,
    },
    {
      title: "Linguine",
      text: "Cuoci le linguine in acqua salata, scolale al dente e saltale in padella",
      add: ["pasta"],
      duration: 110,
      toss: true,
    },
    {
      title: "Prezzemolo",
      text: "Spolvera con prezzemolo fresco tritato",
      add: ["parsley"],
      duration: 65,
    },
    {
      title: "Limone",
      text: "Una spruzzata di limone e si porta in tavola",
      add: ["lemon"],
      duration: 95,
    },
  ],
  outro: "I gamberi freschi li trovi da noi",
};
