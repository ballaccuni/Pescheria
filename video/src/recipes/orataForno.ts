import type { Recipe } from "./types";

export const orataForno: Recipe = {
  vessel: "tray",
  dish: "fish",
  title: ["Filetti di orata al forno", "con pangrattato"],
  servings: "per 2 persone",
  ingredients: [
    { name: "Filetti di orata", qty: "4 (da 2 orate)", icon: "fillet" },
    { name: "Pangrattato", qty: "4 cucchiai", icon: "breadcrumbs" },
    { name: "Prezzemolo", qty: "1 ciuffo", icon: "parsleySprig" },
    { name: "Aglio", qty: "1 spicchio", icon: "garlicClove" },
    { name: "Limone (per servire)", qty: "1", icon: "lemon" },
    { name: "Olio extravergine", qty: "4 cucchiai", icon: "oilBottle" },
    { name: "Sale e pepe", qty: "q.b.", icon: "saltPepper" },
  ],
  steps: [
    {
      title: "La teglia",
      text: "Fodera una teglia con carta forno e versa un filo d'olio",
      add: ["drizzle"],
      duration: 85,
    },
    {
      title: "I filetti",
      text: "Adagia i filetti con la pelle verso il basso, poi sale e pepe",
      add: ["fish", "salt"],
      duration: 110,
    },
    {
      title: "Pangrattato",
      text: "Copri con pangrattato, aglio tritato e prezzemolo",
      add: ["breadcrumbs", "parsley"],
      duration: 115,
    },
    {
      title: "Un filo d'olio",
      text: "Completa con un filo d'olio sopra la panatura",
      add: ["drizzle"],
      duration: 75,
    },
    {
      title: "In forno",
      text: "Cuoci a 200 °C per 15 minuti, finché la panatura è dorata",
      oven: { temp: 200, minutes: 15 },
      duration: 160,
    },
    {
      title: "Impiattamento",
      text: "Servi i filetti con spicchi di limone e prezzemolo fresco",
      plate: true,
      duration: 135,
    },
  ],
  outro: "Le orate fresche le trovi da noi",
};
