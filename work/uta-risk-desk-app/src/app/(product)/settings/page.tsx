import type { Metadata } from "next";
import { SettingsPanel } from "../../../components/settings-panel";
import { describeConnectionHealth } from "../../../domain/connection-health";

export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() { return <section className="product-page"><header className="page-heading"><div><p className="eyebrow">Control plane</p><h1>Settings</h1></div><p>Inspect server readiness, choose the workspace environment and keep the data boundary explicit.</p></header><SettingsPanel connectionHealth={describeConnectionHealth(process.env)} /></section>; }
