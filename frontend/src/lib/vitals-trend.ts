/** Deterministic pseudo time series for demo charts (no randomness between requests). */
export function buildHeartRateTrend(currentHr: number, patientId: number): number[] {
  const n = 14;
  return Array.from({ length: n }, (_, i) => {
    const wave = Math.sin(patientId * 0.37 + i * 0.52) * 5;
    const drift = (i - n / 2) * 0.45;
    const v = currentHr + wave + drift;
    return Math.round(v * 10) / 10;
  });
}
