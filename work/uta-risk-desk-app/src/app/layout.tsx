import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Rulewake — See what the rule changes", template: "%s · Rulewake" },
  description: "Trace the account-level impact of Bitget UTA collateral-rule changes before they take effect.",
};

export const viewport: Viewport = {
  themeColor: "#fbfbf8",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
