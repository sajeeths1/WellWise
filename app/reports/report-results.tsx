import { assess, type Row } from "@/lib/thresholds";

export function ReportResults({ rows }: { rows: Row[] }) {
  const findings = rows.map((row) => ({ row, ...assess(row) }));
  const within = findings.filter((item) => item.category === "safe").length;
  const flagged = findings.filter((item) => item.category === "unsafe").length;
  const rated = within + flagged;
  const unsure = findings.length - rated;
  return (
    <>
      <div className={"finding " + (flagged ? "elevated" : "")} role="status">
        <h3>
          {flagged
            ? "Drinking-water concern detected"
            : "What this report tells you"}
        </h3>
        <p>
          {flagged
            ? "Review the unsafe findings first. Other measurements within range cannot cancel a health concern."
            : "Each label applies to one measurement. UNSURE means more information is needed to judge that item."}
        </p>
      </div>
      {findings.length > 0 && (
        <div className="report-score">
          <strong>
            {rated ? Math.round((100 * within) / rated) + "%" : "—"}
          </strong>
          <div>
            <h3>
              {rated
                ? "of rated results are SAFE"
                : "No SAFE or UNSAFE ratings"}
            </h3>
            <p>
              {within} SAFE · {flagged} UNSAFE · {unsure} UNSURE
            </p>
          </div>
        </div>
      )}
      <ol
        className="measurement-list"
        aria-label="Measurements in report order"
      >
        {findings.map(
          ({ row, meaning, category, healthEffect, reference }, index) => (
            <li key={index}>
              <article className={"finding result-" + category}>
                <div className="measurement-heading">
                  <h4>
                    {row.analyte} · {row.period ? row.period + " " : ""}
                    {row.qualifier === "=" ? "" : row.qualifier}
                    {row.value} {row.unit}
                  </h4>
                  <strong className="measurement-status">
                    {category.toUpperCase()}
                  </strong>
                </div>
                <p>{meaning}</p>
                {healthEffect && (
                  <p>
                    <strong>Possible health effects. </strong>
                    {healthEffect}
                  </p>
                )}
                {reference && <small>{reference}</small>}
              </article>
            </li>
          ),
        )}
      </ol>
      <details>
        <summary>Sources and how to read the labels</summary>
        <p>
          The percentage counts SAFE results out of all SAFE and UNSAFE results.
          UNSURE results are listed separately. A SAFE label applies to the
          listed measurement only. Health limits, appearance guidelines, and
          signs of bacterial contamination answer different questions. A missing
          test has no result to score. For private wells, confirm follow-up with
          your county health department.
        </p>
        <ul>
          <li>
            <a
              className="text-link"
              href="https://www.epa.gov/ground-water-and-drinking-water/national-primary-drinking-water-regulations"
            >
              EPA health-based drinking-water standards ↗
            </a>
          </li>
          <li>
            <a
              className="text-link"
              href="https://www.epa.gov/sdwa/secondary-drinking-water-standards-guidance-nuisance-chemicals"
            >
              EPA taste, appearance and pH guidelines ↗
            </a>
          </li>
          <li>
            <a
              className="text-link"
              href="https://epi.dph.ncdhhs.gov/oee/docs/pHTotalAlkalinityAndPrivateWells.pdf"
            >
              NC guidance on pH and alkalinity ↗
            </a>
          </li>
          <li>
            <a
              className="text-link"
              href="https://pubs.usgs.gov/wri/wri024045/htms/table3.htm"
            >
              USGS guide to minerals and water properties ↗
            </a>
          </li>
        </ul>
      </details>
    </>
  );
}
