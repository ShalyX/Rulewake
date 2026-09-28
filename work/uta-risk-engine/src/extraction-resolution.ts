import {
  validateParameterChangeCandidate,
  type ParameterChange,
  type ParameterChangeContext,
} from "./parameter-change.js";

type LiveEnvelope =
  | { status: "accepted"; candidate: unknown }
  | { status: "rejected"; reason: string }
  | null;

export type ResolvedParameterChange = {
  mode: "live_qwen" | "reviewed_fixture";
  candidate: ParameterChange;
  fallbackReason: string | null;
};

export function resolveParameterChange(input: {
  liveEnvelope: LiveEnvelope;
  reviewedGolden: unknown;
  context: ParameterChangeContext;
}): ResolvedParameterChange {
  const reviewedCandidate = validateParameterChangeCandidate(
    input.reviewedGolden,
    input.context,
  );

  if (input.liveEnvelope?.status === "accepted") {
    try {
      const liveCandidate = validateParameterChangeCandidate(
        input.liveEnvelope.candidate,
        input.context,
      );
      return {
        mode: "live_qwen",
        candidate: liveCandidate,
        fallbackReason: null,
      };
    } catch (error) {
      return {
        mode: "reviewed_fixture",
        candidate: reviewedCandidate,
        fallbackReason: `Live validation failed: ${
          error instanceof Error ? error.message : "unknown validation error"
        }`,
      };
    }
  }

  return {
    mode: "reviewed_fixture",
    candidate: reviewedCandidate,
    fallbackReason: input.liveEnvelope?.status === "rejected"
      ? input.liveEnvelope.reason
      : "Live extraction unavailable",
  };
}
