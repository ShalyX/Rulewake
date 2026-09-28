export type ConnectionHealth = {
  bitget: {
    configured: boolean;
    environment: "demo" | "live";
    label: "Configured" | "Needs configuration";
  };
  qwen: {
    configured: boolean;
    label: "Configured" | "Needs configuration";
  };
};

type Environment = Record<string, string | undefined>;

function hasValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function describeConnectionHealth(environment: Environment): ConnectionHealth {
  const bitgetConfigured = [
    environment.BITGET_API_KEY,
    environment.BITGET_SECRET_KEY,
    environment.BITGET_PASSPHRASE,
  ].every(hasValue);
  const qwenConfigured = hasValue(environment.QWEN_API_KEY);

  return {
    bitget: {
      configured: bitgetConfigured,
      environment: environment.BITGET_DEMO === "true" ? "demo" : "live",
      label: bitgetConfigured ? "Configured" : "Needs configuration",
    },
    qwen: {
      configured: qwenConfigured,
      label: qwenConfigured ? "Configured" : "Needs configuration",
    },
  };
}
