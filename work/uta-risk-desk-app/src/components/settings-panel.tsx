"use client";

import { useEffect, useState } from "react";
import type { ConnectionHealth } from "../domain/connection-health";

const KEY = "rulewake.preferences.v1";
type Preferences = { environment: "demo" | "live"; localHistory: boolean; qwenEnabled: boolean };
const defaults: Preferences = { environment: "demo", localHistory: true, qwenEnabled: true };

export function SettingsPanel({ connectionHealth }: { connectionHealth: ConnectionHealth }) {
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [saved, setSaved] = useState(false);
  useEffect(() => { try { setPrefs({ ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }); } catch {} }, []);
  function save() { localStorage.setItem(KEY, JSON.stringify(prefs)); setSaved(true); window.setTimeout(() => setSaved(false), 1800); }
  return <div className="settings-grid">
    <section className="settings-card settings-card--connections"><div className="settings-title"><span>01</span><div><h2>Connections</h2><p>Connection state is reported by the server. Secret values are never displayed or stored in this browser.</p></div></div>
      <div className="connection-row"><div><i className={`connection-dot${connectionHealth.bitget.configured ? "" : " connection-dot--missing"}`} /><div><strong>Bitget API</strong><small>{connectionHealth.bitget.environment === "demo" ? "Demo trading" : "Live account"} · read-only permissions</small></div></div><span className={`connection-state${connectionHealth.bitget.configured ? "" : " connection-state--missing"}`}>{connectionHealth.bitget.label}</span></div>
      <div className="connection-row"><div><i className={`connection-dot${connectionHealth.qwen.configured ? "" : " connection-dot--missing"}`} /><div><strong>Qwen Max</strong><small>Server-side key · validated-output mode</small></div></div><span className={`connection-state${connectionHealth.qwen.configured ? "" : " connection-state--missing"}`}>{connectionHealth.qwen.label}</span></div>
      <p className="security-note">Rulewake does not request withdrawal or trading permissions. Reconnect credentials through the deployment environment—not this page.</p>
    </section>
    <section className="settings-card"><div className="settings-title"><span>02</span><div><h2>Workspace preferences</h2><p>These preferences stay in this browser.</p></div></div>
      <label className="setting-field"><span>Default environment</span><select value={prefs.environment} onChange={(event) => setPrefs({ ...prefs, environment: event.target.value as Preferences["environment"] })}><option value="demo">Demo trading</option><option value="live">Live account (read-only)</option></select></label>
      <label className="setting-toggle"><span><strong>Save analysis history</strong><small>Store calculation summaries locally.</small></span><input type="checkbox" checked={prefs.localHistory} onChange={(event) => setPrefs({ ...prefs, localHistory: event.target.checked })} /></label>
      <label className="setting-toggle"><span><strong>Enable Qwen explanation</strong><small>Send validated facts and deterministic outputs only.</small></span><input type="checkbox" checked={prefs.qwenEnabled} onChange={(event) => setPrefs({ ...prefs, qwenEnabled: event.target.checked })} /></label>
      <button className="save-settings" type="button" onClick={save}>{saved ? "Preferences saved" : "Save preferences"}</button>
    </section>
    <section className="settings-card"><div className="settings-title"><span>03</span><div><h2>Privacy boundary</h2><p>What leaves the browser when explanation is enabled.</p></div></div>
      <ul className="disclosure-list"><li><span>Sent</span>Rule facts, derived results, held-constant assumptions</li><li><span>Never sent</span>API secrets, raw account payloads, private notes</li><li><span>Model role</span>Explanation after arithmetic—not calculation</li></ul>
    </section>
  </div>;
}
