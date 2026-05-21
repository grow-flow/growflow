// Vapor Pressure Deficit (VPD) — pure formula. Phase-aware judgement of "is
// this VPD ok for this plant?" lives in plantEnvironment.ts; this file just
// computes the number.
//
// Uses leaf temp ≈ air temp - 2°C (typical assumption for cannabis).
// Formula: SVP(T) = 0.6108 * exp(17.27 * T / (T + 237.3)) [kPa]
// VPD = SVP(leafTemp) - SVP(airTemp) * RH/100
export const calculateVPD = (tempC: number, humidityPercent: number, leafOffsetC = 2): number => {
  const svp = (t: number) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));
  const leafTemp = tempC - leafOffsetC;
  const vpd = svp(leafTemp) - svp(tempC) * (humidityPercent / 100);
  return Math.round(vpd * 100) / 100;
};
