import type { Recipe } from "./types";

export const orataForno: Recipe = {
  vessel: "tray",
  dish: "fish",
  title: ["Orata al forno", "con pangrattato"],
  servings: "per 2 persone",
  ingredients: [
    { name: "Orate pulite", qty: "2 da 400 g", icon: "orata" },
    { name: "Pangrattato", qty: "4 cucchiai", icon: "breadcrumbs" },
    { name: "Prezzemolo", qty: "1 ciuffo", icon: "parsleySprig" },
    { name: "Aglio", qty: "1 spicchio", icon: "garlicClove" },
    { name: "Limone", qty: "1", icon: "lemon" },
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
      title: "Le orate",
      text: "Adagia le orate pulite e condisci con sale e pepe",
      add: ["fish", "salt"],
      duration: 110,
    },
    {
      title: "Limone e prezzemolo",
      text: "Metti nella pancia fettine di limone e prezzemolo",
      add: ["lemonSlices"],
      duration: 85,
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
      text: "Cuoci a 200 °C per 25 minuti, finché la panatura è dorata",
      oven: { temp: 200, minutes: 25 },
      duration: 160,
    },
    {
      title: "Impiattamento",
      text: "Servi l'orata con spicchi di limone e prezzemolo fresco",
      plate: true,
      duration: 135,
    },
  ],
  outro: "Le orate fresche le trovi da noi",
};
