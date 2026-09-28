import { describe, expect, it, vi } from "vitest";

import {
  BitgetCredentialSafetyError,
  buildBitgetSignature,
  fetchBitgetReconciliationInputs,
} from "../src/bitget-client.js";

const credentials = {
  apiKey: "test-key",
  secretKey: "test-secret",
  passphrase: "test-passphrase",
};

describe("Bitget request signing", () => {
  it("matches an independently generated HMAC-SHA256 vector", () => {
    expect(
      buildBitgetSignature({
        timestamp: "1700000000000",
        method: "GET",
        requestPath: "/api/v3/account/assets",
        secretKey: "test-secret",
      }),
    ).toBe("yVUzNktSL9rd4P/HLvFgZNQsPnGPruukQ4D2RL13nq4=");
  });
});

describe("read-only Bitget reconciliation client", () => {
  it("checks key permissions before fetching the two reconciliation inputs", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: "00000",
        msg: "success",
        requestTime: 1700000000000,
        data: { permType: "readonly", permissions: ["uta_mgt"] },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: "00000",
        msg: "success",
        requestTime: 1700000000001,
        data: { effEquity: "1" },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: "00000",
        msg: "success",
        requestTime: 1700000000002,
        data: { accountLevel: "advanced" },
      }), { status: 200 }));

    const result = await fetchBitgetReconciliationInputs(credentials, {
      fetchImpl: fetchMock,
      now: () => 1700000000000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://api.bitget.com/api/v3/account/info",
      "https://api.bitget.com/api/v3/account/assets",
      "https://api.bitget.com/api/v3/account/settings",
    ]);
    expect(result.assetsResponse.data.effEquity).toBe("1");
    expect(result.settingsResponse.data.accountLevel).toBe("advanced");

    const firstHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(firstHeaders.get("ACCESS-KEY")).toBe("test-key");
    expect(firstHeaders.get("ACCESS-PASSPHRASE")).toBe("test-passphrase");
    expect(firstHeaders.get("ACCESS-SIGN")).toBeTruthy();
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("test-secret");
  });

  it("refuses read-write credentials before fetching account data", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      code: "00000",
      msg: "success",
      requestTime: 1700000000000,
      data: { permType: "read-and-write", permissions: ["uta_mgt", "uta_trade"] },
    }), { status: 200 }));

    await expect(
      fetchBitgetReconciliationInputs(credentials, {
        fetchImpl: fetchMock,
        now: () => 1700000000000,
      }),
    ).rejects.toBeInstanceOf(BitgetCredentialSafetyError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports only the endpoint and Bitget error code for HTTP failures", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      code: "40014",
      msg: "Invalid API-key",
    }), { status: 400 }));

    await expect(
      fetchBitgetReconciliationInputs(credentials, {
        fetchImpl: fetchMock,
        now: () => 1700000000000,
      }),
    ).rejects.toThrow(
      "/api/v3/account/info returned HTTP 400; Bitget code 40014: Invalid API-key",
    );
  });

  it("adds Bitget's demo-trading header only when demo mode is explicit", async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(JSON.stringify({
        code: "00000",
        msg: "success",
        requestTime: 1700000000000,
        data: { permType: "read-only", permissions: ["uta_mgt"] },
      }), { status: 200 }));

    await fetchBitgetReconciliationInputs(
      { ...credentials, demo: true },
      { fetchImpl: fetchMock, now: () => 1700000000000 },
    );

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("paptrading")).toBe("1");
  });
});
