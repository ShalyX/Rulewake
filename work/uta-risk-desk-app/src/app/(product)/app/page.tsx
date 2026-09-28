import type { Metadata } from "next";
import { RiskDesk } from "../../../components/risk-desk";

export const metadata: Metadata = { title: "Workspace" };

export default function WorkspacePage() { return <RiskDesk embedded />; }
