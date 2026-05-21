// Single source of truth for plant↔area environmental fit. Every component
// that wants to express "is this plant happy where it lives?" calls
// evaluatePlantHappiness — no component reimplements the comparison or
// reasons about phase identity by name.

import { Plant, GrowArea, AreaEvent, PhaseEnvTargets } from "../types/models";
import { createPlantTimeline } from "./PlantTimeline";
import { calculateVPD } from "./vpd";

export type DimensionStatus = "ok" | "low" | "high" | "unknown";
export type Severity = "ok" | "warn" | "error";
export type OverallStatus = "happy" | "mostly-happy" | "unhappy" | "unknown";

export interface DimensionResult {
  status: DimensionStatus;
  value: number | null;
  target: { min: number | null; max: number | null };
  label: string;
  severity: Severity;
  unit: string;
}

export interface PlantHappiness {
  overall: OverallStatus;
  vpd: DimensionResult;
  temperature: DimensionResult;
  humidity: DimensionResult;
  light: DimensionResult;
  summary: string;
  issues: string[];
  hasArea: boolean;
  hasReadings: boolean;
}

const UNKNOWN = (unit: string): DimensionResult => ({
  status: "unknown",
  value: null,
  target: { min: null, max: null },
  label: "—",
  severity: "ok",
  unit,
});

// Score a numeric reading against an optional target band. The band can be
// fully open (no min, no max), one-sided, or closed. Tolerance defines the
// "warn" zone — within `tolerance` of the band edge counts as warn rather
// than error. Tolerance is expressed as a fraction of the band width
// (so a 0.8–1.2 VPD band has tolerance = 0.4 * 0.15 = 0.06 kPa for 15%).
const scoreDimension = (
  value: number | null,
  min: number | null,
  max: number | null,
  unit: string,
  niceName: string,
  tolerancePct = 0.15,
): DimensionResult => {
  if (value == null) {
    return { ...UNKNOWN(unit), target: { min, max } };
  }
  if (min == null && max == null) {
    return {
      status: "unknown",
      value,
      target: { min, max },
      label: `${value}${unit}`,
      severity: "ok",
      unit,
    };
  }

  const bandWidth = (min != null && max != null) ? Math.max(max - min, 0.001) : 1;
  const tol = bandWidth * tolerancePct;

  let status: DimensionStatus = "ok";
  let severity: Severity = "ok";
  let label = `Ideal ${niceName}`;

  if (min != null && value < min) {
    status = "low";
    severity = value < min - tol ? "error" : "warn";
    label = severity === "error" ? `${niceName} too low` : `${niceName} low`;
  } else if (max != null && value > max) {
    status = "high";
    severity = value > max + tol ? "error" : "warn";
    label = severity === "error" ? `${niceName} too high` : `${niceName} high`;
  }

  return { status, severity, value, target: { min, max }, label, unit };
};

const parseLightOnHours = (schedule: string | null | undefined): number | null => {
  if (!schedule) return null;
  const onPart = schedule.split("/")[0];
  const hours = parseInt(onPart ?? "", 10);
  return Number.isFinite(hours) ? hours : null;
};

const latestEnvReading = (area: GrowArea | null): { temp: number | null; humidity: number | null } => {
  if (!area?.events) return { temp: null, humidity: null };
  const latest = area.events.find((e: AreaEvent) => e.type === "environment");
  return {
    temp: latest?.data?.temperature_c ?? null,
    humidity: latest?.data?.humidity_percent ?? null,
  };
};

const aggregateOverall = (dims: DimensionResult[]): OverallStatus => {
  const scored = dims.filter(d => d.status !== "unknown");
  if (scored.length === 0) return "unknown";
  if (scored.some(d => d.severity === "error")) return "unhappy";
  if (scored.some(d => d.severity === "warn")) return "mostly-happy";
  return "happy";
};

const buildSummary = (h: { vpd: DimensionResult; temperature: DimensionResult; humidity: DimensionResult; light: DimensionResult; overall: OverallStatus }): { summary: string; issues: string[] } => {
  const issues: string[] = [];
  for (const d of [h.vpd, h.temperature, h.humidity, h.light]) {
    if (d.severity !== "ok") issues.push(d.label);
  }
  let summary: string;
  switch (h.overall) {
    case "happy": summary = "Conditions on target"; break;
    case "mostly-happy": summary = `Mostly ok — ${issues.join(", ")}`; break;
    case "unhappy": summary = issues.join(", "); break;
    default: summary = "No environmental data";
  }
  return { summary, issues };
};

export const evaluatePlantHappiness = (plant: Plant, area: GrowArea | null): PlantHappiness => {
  const timeline = createPlantTimeline(plant.phases ?? [], plant.events ?? []);
  const phase = timeline.currentPhase;
  const targets: PhaseEnvTargets = phase
    ? {
        vpdMin: phase.vpdMin, vpdMax: phase.vpdMax,
        tempMin: phase.tempMin, tempMax: phase.tempMax,
        humidityMin: phase.humidityMin, humidityMax: phase.humidityMax,
        lightOnHours: phase.lightOnHours,
      }
    : { vpdMin: null, vpdMax: null, tempMin: null, tempMax: null, humidityMin: null, humidityMax: null, lightOnHours: null };

  const { temp, humidity } = latestEnvReading(area);
  const vpdValue = (temp != null && humidity != null) ? calculateVPD(temp, humidity) : null;
  const lightOn = parseLightOnHours(area?.lightSchedule);

  const vpd = scoreDimension(vpdValue, targets.vpdMin, targets.vpdMax, " kPa", "VPD");
  const temperature = scoreDimension(temp, targets.tempMin, targets.tempMax, "°C", "Temp");
  const humidityDim = scoreDimension(humidity, targets.humidityMin, targets.humidityMax, "%", "Humidity");
  // Light tolerance is a fixed ±2h regardless of band width — schedules are integer hours.
  const light = (() => {
    if (targets.lightOnHours == null || lightOn == null) {
      return { ...UNKNOWN("h on"), target: { min: targets.lightOnHours, max: targets.lightOnHours } };
    }
    const diff = Math.abs(lightOn - targets.lightOnHours);
    if (diff === 0) return { status: "ok" as const, severity: "ok" as const, value: lightOn, target: { min: targets.lightOnHours, max: targets.lightOnHours }, label: "Light schedule ok", unit: "h on" };
    if (diff <= 2) return { status: lightOn < targets.lightOnHours ? "low" as const : "high" as const, severity: "warn" as const, value: lightOn, target: { min: targets.lightOnHours, max: targets.lightOnHours }, label: `Light schedule off by ${diff}h`, unit: "h on" };
    return { status: lightOn < targets.lightOnHours ? "low" as const : "high" as const, severity: "error" as const, value: lightOn, target: { min: targets.lightOnHours, max: targets.lightOnHours }, label: `Light schedule wrong (${lightOn}/${24 - lightOn} vs expected ${targets.lightOnHours}/${24 - targets.lightOnHours})`, unit: "h on" };
  })();

  const overall = aggregateOverall([vpd, temperature, humidityDim, light]);
  const { summary, issues } = buildSummary({ vpd, temperature, humidity: humidityDim, light, overall });

  return {
    overall,
    vpd,
    temperature,
    humidity: humidityDim,
    light,
    summary,
    issues,
    hasArea: area != null,
    hasReadings: temp != null || humidity != null,
  };
};

// MUI chip color from overall status — keeps consumers from hardcoding the mapping.
export const happinessColor = (overall: OverallStatus): "success" | "warning" | "error" | "default" => {
  switch (overall) {
    case "happy": return "success";
    case "mostly-happy": return "warning";
    case "unhappy": return "error";
    default: return "default";
  }
};
