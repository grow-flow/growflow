import { PlantEvent } from "../types/models";

export const EVENT_TYPES = {
  watering: {
    icon: "💧",
    color: "#2196F3",
    title: "Watering & Feeding",
    fields: [
      "amount_ml",
      "nutrients",
      "ph_level",
      "ec_ppm",
      "water_temperature",
      "runoff_ph",
      "runoff_ec",
    ],
  },
  observation: {
    icon: "👁️",
    color: "#FF9800",
    title: "Observation",
    fields: ["observation_type", "severity", "resolved", "photos"],
  },
  training: {
    icon: "✂️",
    color: "#9C27B0",
    title: "Training",
    fields: ["training_method", "photos"],
  },
  harvest: {
    icon: "🌾",
    color: "#795548",
    title: "Harvest",
    fields: ["wet_weight", "dry_weight", "photos"],
  },
  transplant: {
    icon: "🪴",
    color: "#607D8B",
    title: "Transplant",
    fields: ["photos"],
  },
  custom: {
    icon: "📝",
    color: "#616161",
    title: "Custom Event",
    fields: ["custom_fields"],
  },
} as const;

export const QUICK_EVENT_TEMPLATES = {
  watering: [
    { 
      title: "Plain Water", 
      data: { amount_ml: 500 } 
    },
    { 
      title: "Light Watering", 
      data: { amount_ml: 250 } 
    },
    { 
      title: "Deep Watering", 
      data: { amount_ml: 1000 } 
    },
    {
      title: "Advanced Nutrients Starter",
      data: {
        amount_ml: 500,
        nutrients: [
          { name: "Sensi Grow A", amount_ml: 10 },
          { name: "Sensi Grow B", amount_ml: 10 },
          { name: "K-52", amount_ml: 20 },
          { name: "Voodoo Juice", amount_ml: 20 },
        ],
      },
    },
    {
      title: "Veg Nutrients",
      data: { 
        amount_ml: 500,
        nutrients: [{ name: "Veg NPK", amount_ml: 10 }] 
      },
    },
    {
      title: "Bloom Nutrients",
      data: { 
        amount_ml: 500,
        nutrients: [{ name: "Bloom NPK", amount_ml: 15 }] 
      },
    },
    {
      title: "Cal-Mag",
      data: { 
        amount_ml: 500,
        nutrients: [{ name: "Cal-Mag", amount_ml: 5 }] 
      },
    },
  ],
  observation: [
    {
      title: "Healthy Growth",
      data: { observation_type: "health" as const, severity: "low" as const },
    },
    { title: "Pest Check", data: { observation_type: "pest" as const } },
    {
      title: "Deficiency Spotted",
      data: {
        observation_type: "deficiency" as const,
        severity: "medium" as const,
      },
    },
  ],
  training: [
    { title: "LST", data: { training_method: "Low Stress Training" } },
    { title: "Topping", data: { training_method: "Topping" } },
    { title: "Defoliation", data: { training_method: "Defoliation" } },
  ],
  harvest: [{ title: "Full Harvest", data: { wet_weight: 0 } }],
  transplant: [
    { title: "Pot Size Up", data: {} },
    { title: "Medium Change", data: {} },
  ],
  custom: [{ title: "Custom Event", data: {} }],
};

export type EventType = keyof typeof EVENT_TYPES;

export const getEventIcon = (type: PlantEvent["type"]): string => {
  return EVENT_TYPES[type]?.icon || "📝";
};

export const getEventColor = (type: PlantEvent["type"]): string => {
  return EVENT_TYPES[type]?.color || "#616161";
};
