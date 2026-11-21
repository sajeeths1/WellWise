"use client";
import Link from "next/link";
import { Icon, type IconName } from "./icons";
import { useWell } from "./workspace";
export default function Dashboard() {
  const { county, observation, review } = useWell();
  const cards: [string, IconName, string, string, string][] = [
    [
      "/observations",
      "camera",
      "Water observations",
      observation ? "1 recorded" : "No observations yet",
      "Document a change in appearance.",
    ],
    [
      "/testing",
      "pin",
      "Local testing",
      county === "Other"
        ? "NC directory"
        : county
          ? county + " County"
          : "Choose your county",
      "Find your well testing contact.",
    ],
    [
      "/reports",
      "report",
      "Lab reports",
      review || "No reviewed reports",
      "Review the numbers from your lab.",
    ],
  ];
  return (
    <>
      <div className="heading">
        <h1>Well dashboard</h1>
        <p>
          Your observations, testing resources, and lab results in one place.
        </p>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <h2>
            Understand your
            <br />
            well-water report.
          </h2>
          <p>
            Take a picture of your lab results to read the numbers and see what
            they mean.
          </p>
          <Link className="button mint" href="/reports">
            <Icon name="camera" />
            Scan a lab report
          </Link>
        </div>
      </section>
      <h2 className="section-title">Your workspace</h2>
      <div className="cards">
        {cards.map(([url, icon, title, status, desc], i) => (
          <Link className={"card tone" + i} href={url} key={url}>
            <span className="card-top">
              <i>
                <Icon name={icon} />
              </i>
              <Icon name="arrow" />
            </span>
            <h3>{title}</h3>
            <p>{desc}</p>
            <strong className="card-status">{status}</strong>
          </Link>
        ))}
      </div>
      <div className="demo">
        <i>
          <Icon name="report" />
        </i>
        <div>
          <h3>Explore a sample lab report</h3>
          <p>Compare a synthetic metals panel with EPA reference levels.</p>
        </div>
        <Link className="text-link" href="/reports#samples">
          Open sample <Icon name="arrow" />
        </Link>
      </div>
    </>
  );
}
