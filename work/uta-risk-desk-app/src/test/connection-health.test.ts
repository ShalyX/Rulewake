import { describe, expect, it } from "vitest";
import { describeConnectionHealth } from "../domain/connection-health";

describe("describeConnectionHealth", () => {
  it("reports configured providers without returning secret values", () => {
    const result = describeConnectionHealth({
      BITGET_API_KEY: "bitget-key",
      BITGET_SECRET_KEY: "bitget-secret",
      BITGET_PASSPHRASE: "bitget-passphrase",
      BITGET_DEMO: "true",
      QWEN_API_KEY: "qwen-key",
    });

    expect(result).toEqual({
      bitget: { configured: true, environment: "demo", label: "Configured" },
      qwen: { configured: true, label: "Configured" },
    });
    expect(JSON.stringify(result)).not.toContain("bitget-secret");
    expect(JSON.stringify(result)).not.toContain("qwen-key");
  });

  it("fails closed when any required provider value is blank", () => {
    expect(describeConnectionHealth({
      BITGET_API_KEY: "bitget-key",
      BITGET_SECRET_KEY: " ",
      BITGET_PASSPHRASE: "bitget-passphrase",
      BITGET_DEMO: "false",
      QWEN_API_KEY: "",
    })).toEqual({
      bitget: { configured: false, environment: "live", label: "Needs configuration" },
      qwen: { configured: false, label: "Needs configuration" },
    });
  });
});
