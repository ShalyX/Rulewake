import { createHmac } from "node:crypto";

import type {
  BitgetAccountAssetsResponse,
  BitgetAccountSettingsResponse,
} from "./bitget-reconciliation.js";

export type BitgetReadOnlyCredentials = {
  apiKey: string;
  secretKey: string;
  passphrase: string;
  demo?: boolean;
};

export type BitgetSignatureInput = {
  timestamp: string;
  method: "GET" | "POST";
  requestPath: string;
  queryString?: string;
  body?: string;
  secretKey: string;
};

export type BitgetClientOptions = {
  fetchImpl?: typeof fetch;
  now?: () => number;
  baseUrl?: string;
};

type BitgetAccountInfoResponse = {
  code: string;
  msg: string;
  requestTime: number;
  data: {
    permType: string;
    permissions: string[];
  };
};

export class BitgetClientError extends Error {
  override readonly name: string = "BitgetClientError";
}

export class BitgetCredentialSafetyError extends BitgetClientError {
  override readonly name: string = "BitgetCredentialSafetyError";
}

export function buildBitgetSignature(input: BitgetSignatureInput): string {
  const query = input.queryString ? `?${input.queryString}` : "";
  const body = input.body ?? "";
  const message = `${input.timestamp}${input.method.toUpperCase()}${input.requestPath}${query}${body}`;

  return createHmac("sha256", input.secretKey)
    .update(message, "utf8")
    .digest("base64");
}

function assertCredentials(credentials: BitgetReadOnlyCredentials): void {
  const fields: Array<[string, string]> = [
    ["apiKey", credentials.apiKey],
    ["secretKey", credentials.secretKey],
    ["passphrase", credentials.passphrase],
  ];
  for (const [label, value] of fields) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new BitgetCredentialSafetyError(`${label} is required`);
    }
  }
}

async function signedGet<T>(input: {
  credentials: BitgetReadOnlyCredentials;
  path: string;
  baseUrl: string;
  now: () => number;
  fetchImpl: typeof fetch;
}): Promise<T> {
  const timestamp = String(input.now());
  const signature = buildBitgetSignature({
    timestamp,
    method: "GET",
    requestPath: input.path,
    secretKey: input.credentials.secretKey,
  });
  const headers = new Headers({
    "ACCESS-KEY": input.credentials.apiKey,
    "ACCESS-SIGN": signature,
    "ACCESS-TIMESTAMP": timestamp,
    "ACCESS-PASSPHRASE": input.credentials.passphrase,
    "Content-Type": "application/json",
    locale: "en-US",
  });
  if (input.credentials.demo === true) {
    headers.set("paptrading", "1");
  }

  let response: Response;
  try {
    response = await input.fetchImpl(`${input.baseUrl}${input.path}`, {
      method: "GET",
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown network error";
    throw new BitgetClientError(
      `Bitget request to ${input.path} failed: ${message}`,
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const errorPayload = await response.json() as { code?: unknown; msg?: unknown };
      const code = typeof errorPayload.code === "string" ? errorPayload.code : "unknown";
      const message = typeof errorPayload.msg === "string"
        ? errorPayload.msg.slice(0, 200)
        : "no message";
      detail = `; Bitget code ${code}: ${message}`;
    } catch {
      detail = "; response body was not JSON";
    }
    throw new BitgetClientError(
      `Bitget request to ${input.path} returned HTTP ${response.status}${detail}`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new BitgetClientError("Bitget response was not valid JSON");
  }

  if (payload === null || typeof payload !== "object") {
    throw new BitgetClientError("Bitget response must be a JSON object");
  }
  return payload as T;
}

export async function fetchBitgetReconciliationInputs(
  credentials: BitgetReadOnlyCredentials,
  options: BitgetClientOptions = {},
): Promise<{
  assetsResponse: BitgetAccountAssetsResponse;
  settingsResponse: BitgetAccountSettingsResponse;
}> {
  assertCredentials(credentials);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const baseUrl = options.baseUrl ?? "https://api.bitget.com";

  if (baseUrl !== "https://api.bitget.com") {
    throw new BitgetCredentialSafetyError(
      "live credentials may only be sent to https://api.bitget.com",
    );
  }

  const shared = { credentials, baseUrl, now, fetchImpl };
  const accountInfo = await signedGet<BitgetAccountInfoResponse>({
    ...shared,
    path: "/api/v3/account/info",
  });

  if (accountInfo.code !== "00000") {
    throw new BitgetClientError(
      `Bitget account-info check failed with code ${accountInfo.code}`,
    );
  }
  const readOnlyPermissionTypes = new Set(["read-only", "readonly"]);
  if (!readOnlyPermissionTypes.has(accountInfo.data?.permType)) {
    const permissions = Array.isArray(accountInfo.data?.permissions)
      ? accountInfo.data.permissions.join(",")
      : "unknown";
    throw new BitgetCredentialSafetyError(
      `refusing account access because Bitget reports permType=${accountInfo.data?.permType ?? "unknown"}; permissions=${permissions}`,
    );
  }
  if (!accountInfo.data.permissions?.includes("uta_mgt")) {
    throw new BitgetCredentialSafetyError(
      "the read-only API key lacks UTA management permission",
    );
  }

  const assetsResponse = await signedGet<BitgetAccountAssetsResponse>({
    ...shared,
    path: "/api/v3/account/assets",
  });
  const settingsResponse = await signedGet<BitgetAccountSettingsResponse>({
    ...shared,
    path: "/api/v3/account/settings",
  });

  return { assetsResponse, settingsResponse };
}
