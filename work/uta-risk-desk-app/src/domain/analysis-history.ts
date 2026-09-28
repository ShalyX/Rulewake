export const HISTORY_KEY = "rulewake.analysis-history.v1";

export type SavedAnalysis = {
  id: string;
  createdAt: string;
  eventId: string;
  eventTitle: string;
  asset: string;
  accountLabel: string;
  beforeRatio: string;
  projectedRatio: string;
  collateralDeltaUsd: string;
  riskBand: string;
  engineVersion: string;
};

export function readAnalysisHistory(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is SavedAnalysis => Boolean(item && typeof item === "object" && "id" in item)) : [];
  } catch { return []; }
}

export function saveAnalysis(item: SavedAnalysis): void {
  const existing = readAnalysisHistory().filter((saved) => saved.id !== item.id);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...existing].slice(0, 50)));
}

export function clearAnalysisHistory(): void {
  window.localStorage.removeItem(HISTORY_KEY);
}
