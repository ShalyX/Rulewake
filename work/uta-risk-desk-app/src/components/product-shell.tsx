"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const items = [
  ["/app", "Workspace"],
  ["/analyses", "Analyses"],
  ["/library", "Rule library"],
  ["/settings", "Settings"],
] as const;

export function ProductShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [environment, setEnvironment] = useState<"demo" | "live">("demo");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rulewake.preferences.v1") ?? "{}");
      if (saved.environment === "live") setEnvironment("live");
    } catch {}
  }, [pathname]);
  return (
    <div className="product-root">
      <a className="skip-link" href="#product-content">Skip to main content</a>
      <header className="product-header">
        <Link className="brand-lockup" href="/" aria-label="Rulewake home">
          <span className="rulewake-mark" aria-hidden="true"><i /><i /><i /></span><strong>RULEWAKE</strong>
        </Link>
        <nav className="product-nav" aria-label="Product navigation">
          {items.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
        </nav>
        <div className="connection-chip"><i /> {environment === "live" ? "Live" : "Demo"} · read-only</div>
      </header>
      <main id="product-content">{children}</main>
    </div>
  );
}
