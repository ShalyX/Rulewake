import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RiskDesk } from "../components/risk-desk";

describe("sample-mode risk desk", () => {
  it("presents the locked Rulewake causal-field identity and mechanism", () => {
    render(<RiskDesk />);

    expect(screen.getByText("RULEWAKE")).toBeInTheDocument();
    expect(screen.getByText(/see what the rule changes/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /causal impact field/i })).toBeInTheDocument();
    expect(screen.getByText(/rule change enters/i)).toBeInTheDocument();
    expect(screen.getAllByText(/collateral contribution/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/effective equity/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/margin ratio/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/required buffer/i).length).toBeGreaterThan(0);
  });

  it("lets the user scrub across the effective-time threshold after calculation", async () => {
    const user = userEvent.setup();
    render(<RiskDesk />);

    const timeView = screen.getByRole("slider", { name: /effective-time view/i });
    expect(timeView).toHaveValue("0");
    expect(screen.getByText(/before the rule takes effect/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /calculate impact/i }));
    expect(timeView).toHaveValue("100");
    expect(screen.getByText(/after the rule takes effect/i)).toBeInTheDocument();

    fireEvent.change(timeView, { target: { value: "0" } });
    expect(screen.getByText(/before the rule takes effect/i)).toBeInTheDocument();
  });

  it("supports a keyboard-first path with explicit control relationships", async () => {
    const user = userEvent.setup();
    render(<RiskDesk />);

    await user.tab();
    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("combobox", { name: /reviewed event/i })).toHaveFocus();
    expect(screen.getByRole("combobox", { name: /reviewed event/i })).toHaveAttribute("name", "eventId");
    expect(screen.getByRole("combobox", { name: /sample account/i })).toHaveAttribute("name", "accountId");

    const calculate = screen.getByRole("button", { name: /calculate impact/i });
    calculate.focus();
    await user.keyboard("{Enter}");

    const traceToggle = screen.getByRole("button", { name: /show calculation trace/i });
    expect(traceToggle).toHaveAttribute("aria-controls", "calculation-trace");
    traceToggle.focus();
    await user.keyboard("{Enter}");
    expect(document.getElementById("calculation-trace")).toBeInTheDocument();
  });

  it("takes a first-time user from reviewed evidence to an inspectable impact result", async () => {
    const user = userEvent.setup();
    render(<RiskDesk />);

    expect(screen.getByRole("combobox", { name: /reviewed event/i })).toHaveValue("rstrc-2026-07-01");
    expect(screen.getByRole("combobox", { name: /sample account/i })).toHaveValue("canonical-risk");
    expect(screen.getByRole("heading", { name: /rstrc collateral ratio change/i })).toBeInTheDocument();
    expect(screen.getByText(/reviewed fixture/i)).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.queryByText(/projected margin ratio/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /calculate impact/i }));

    expect(screen.getByText(/projected margin ratio/i)).toBeInTheDocument();
    expect(screen.getAllByText("100.00%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Warning").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Critical").length).toBeGreaterThan(0);
    expect(screen.getAllByText("−$5,000.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$28,333.34").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /export decision worksheet/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show calculation trace/i }));
    expect(screen.getByText(/normalized numerator/i)).toBeInTheDocument();
    expect(screen.getByText(/positions held constant/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: /target ratio/i }), "0.8");
    expect(screen.getAllByText("$21,250.00").length).toBeGreaterThan(0);
    expect(screen.getByText(/buffer to 80% target/i)).toBeInTheDocument();
  });

  it("recalculates against the newly selected event and clears the previous result", async () => {
    const user = userEvent.setup();
    render(<RiskDesk />);

    await user.click(screen.getByRole("button", { name: /calculate impact/i }));
    expect(screen.getAllByText("100.00%").length).toBeGreaterThan(0);

    await user.selectOptions(
      screen.getByRole("combobox", { name: /reviewed event/i }),
      "aster-2026-04-30",
    );

    expect(screen.queryByText(/projected margin ratio/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /aster collateral ratio change/i })).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /calculate impact/i }));
    expect(screen.getAllByText("53.63%").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /risk improves to stable/i })).toBeInTheDocument();
  });

  it("uses the selected account baseline and blocks stale snapshots", async () => {
    const user = userEvent.setup();
    render(<RiskDesk />);

    const accountSelect = screen.getByRole("combobox", { name: /sample account/i });
    await user.selectOptions(accountSelect, "buffered-risk");
    expect(screen.getAllByText("42.50%").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /calculate impact/i }));
    expect(screen.getAllByText("43.59%").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /risk remains stable/i })).toBeInTheDocument();

    await user.selectOptions(accountSelect, "stale-risk");
    expect(screen.queryByText(/projected margin ratio/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /calculate impact/i })).toBeDisabled();
    expect(screen.getByText(/stale snapshot cannot be calculated/i)).toBeInTheDocument();
  });

  it("requests a server-validated Qwen explanation without replacing the deterministic result", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({
      mode: "live_qwen",
      text: "Qwen explains the already-computed change under the displayed held-constant assumptions. This is an estimate; you decide whether to act.",
      fallbackReason: null,
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchImpl);
    render(<RiskDesk />);

    expect(screen.queryByRole("button", { name: /explain with qwen/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /calculate impact/i }));
    await user.click(screen.getByRole("button", { name: /explain with qwen/i }));

    expect(await screen.findByText(/qwen explains the already-computed change/i)).toBeInTheDocument();
    expect(screen.getByText(/qwen · validated/i)).toBeInTheDocument();
    expect(screen.getAllByText("100.00%").length).toBeGreaterThan(0);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const request = fetchImpl.mock.calls[0];
    expect(String(request?.[0])).toBe("/api/explain");
    expect(String(request?.[1]?.body)).toContain('"eventId":"rstrc-2026-07-01"');
  });

  it("shows a deterministic explanation when the explanation route cannot be reached", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network unavailable"); }));
    render(<RiskDesk />);

    await user.click(screen.getByRole("button", { name: /calculate impact/i }));
    await user.click(screen.getByRole("button", { name: /explain with qwen/i }));

    expect(await screen.findByText(/validated fallback/i)).toBeInTheDocument();
    expect(screen.getByText(/qwen route could not be reached/i)).toBeInTheDocument();
    expect(screen.getAllByText("100.00%").length).toBeGreaterThan(0);
  });

  it("announces a pending Qwen request and recovers on retry after an outage", async () => {
    const user = userEvent.setup();
    let rejectFirst: ((reason?: unknown) => void) | undefined;
    const firstRequest = new Promise<Response>((_resolve, reject) => {
      rejectFirst = reject;
    });
    const fetchImpl = vi.fn()
      .mockImplementationOnce(() => firstRequest)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        mode: "live_qwen",
        text: "Qwen returned a validated explanation after retry while preserving the deterministic calculation. This is an estimate; you decide whether to act.",
        fallbackReason: null,
      }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchImpl);
    render(<RiskDesk />);

    await user.click(screen.getByRole("button", { name: /calculate impact/i }));
    await user.click(screen.getByRole("button", { name: /explain with qwen/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/checking the grounded facts/i);
    expect(screen.getByRole("button", { name: /asking qwen/i })).toBeDisabled();

    rejectFirst?.(new TypeError("network unavailable"));
    expect(await screen.findByText(/qwen route could not be reached/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retry qwen explanation/i }));
    expect(await screen.findByText(/qwen returned a validated explanation after retry/i)).toBeInTheDocument();
    expect(screen.getByText(/qwen · validated/i)).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
