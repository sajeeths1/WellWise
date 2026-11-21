"use client";

import type { Row } from "@/lib/thresholds";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState } from "react";
import { Icon, type IconName } from "./icons";

type Observation = { description: string; change: string };
function useWorkspaceState() {
  const [county, setCounty] = useState("");
  const [observation, saveObservation] = useState<Observation | null>(null);
  const [lastReport, setLastReport] = useState<{
    text: string;
    rows: Row[];
  } | null>(null);
  const review = lastReport ? "Report reviewed" : "";
  return {
    county,
    setCounty,
    observation,
    saveObservation,
    review,
    lastReport,
    setLastReport,
  };
}
const Context = createContext<ReturnType<typeof useWorkspaceState> | null>(
  null,
);
export function useWell() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing WellWise workspace");
  return value;
}
const links: [string, string, IconName][] = [
  ["/", "Dashboard", "dashboard"],
  ["/observations", "Water observations", "camera"],
  ["/testing", "Local testing", "pin"],
  ["/reports", "Lab reports", "report"],
];
export default function Workspace({ children }: { children: React.ReactNode }) {
  const state = useWorkspaceState();
  const path = usePathname();
  return (
    <Context.Provider value={state}>
      <div className="workspace">
        <aside className="sidebar">
          <Link className="brand" href="/">
            <i>
              <Icon name="drop" />
            </i>
            WellWise
          </Link>
          <nav aria-label="Workspace">
            {links.map(([url, label, icon]) => (
              <Link
                key={url}
                aria-current={path === url ? "page" : undefined}
                href={url}
              >
                <Icon name={icon} />
                {label}
              </Link>
            ))}
          </nav>
          <a
            className="guide"
            href="https://epi.dph.ncdhhs.gov/oee/programs/wellwater.html"
          >
            <Icon name="book" /> NC well owner guide ↗
          </a>
        </aside>
        <div className="body">
          <header>
            <span>
              My workspace <b>/</b>{" "}
              <strong>{links.find(([url]) => url === path)?.[1]}</strong>
            </span>
            <Link href="/testing">
              <Icon name="pin" />
              {state.county && state.county !== "Other"
                ? state.county + " County"
                : "North Carolina"}
            </Link>
          </header>
          <main>{children}</main>
          <footer>
            Private wells are not regulated by EPA. Results are compared to EPA
            public drinking water standards as a reference. This is
            informational, not medical advice. Contact your county health
            department.
          </footer>
        </div>
      </div>
    </Context.Provider>
  );
}
