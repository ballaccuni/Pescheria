import type { Recipe } from "./types";

export const orataForno: Recipe = {
  vessel: "tray",
  dish: "fish",
  title: ["Filetti di orata al forno", "con pangrattato"],
  servings: "per 2 persone",
  ingredients: [
    { name: "Filetti di orata", qty: "4 (da 2 orate)", icon: "fillet" },
    { name: "Pangrattato", qty: "4 cucchiai", icon: "breadcrumbs" },
    { name: "Prezzemolo tritato", qty: "1 ciuffo", icon: "parsleySprig" },
    { name: "Aglio tritato", qty: "1 spicchio", icon: "garlicClove" },
    { name: "Limone (per servire)", qty: "1", icon: "lemon" },
    { name: "Olio extravergine", qty: "4 cucchiai", icon: "oilBottle" },
    { name: "Sale e pepe", qty: "q.b.", icon: "saltPepper" },
  ],
  steps: [
    {
      title: "Il condimento",
      text: "In una ciotola metti il pangrattato, il prezzemolo e l'aglio tritati",
      stage: "mixbowl",
      add: ["mixBase"],
      duration: 112,
    },
    {
      title: "Olio, sale e pepe",
      text: "Aggiungi un cucchiaio d'olio, sale e pepe e mescola bene",
      stage: "mixbowl",
      add: ["mixFinish"],
      duration: 150,
    },
    {
      title: "La teglia",
      text: "Fodera una teglia con carta forno e versa un filo d'olio",
      add: ["drizzle"],
      duration: 85,
    },
    {
      title: "I filetti",
      text: "Adagia i filetti nella teglia con la pelle verso il basso",
      add: ["fish"],
      duration: 85,
    },
    {
      title: "Copri con il condimento",
      text: "Distribuisci il condimento sopra i filetti",
      add: ["breadcrumbs", "parsley"],
      duration: 110,
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
