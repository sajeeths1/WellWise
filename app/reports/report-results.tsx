import { assess, type Row, type Category } from "@/lib/thresholds";

const groups: [Category, string][] = [
  ["unsafe", "Unsafe to use"],
  ["unsure", "Unsure because of insufficient information"],
  ["safe", "Safe to use"],
];
export function ReportResults({ rows }: { rows: Row[] }) {
  const findings = rows.map((row) => ({ row, ...assess(row) }));
  const within = findings.filter((item) => item.category === "safe").length;
  const flagged = findings.filter((item) => item.category === "unsafe").length;
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
            : "These categories describe each confirmed measurement at the time and place sampled. Overall drinking safety depends on other contaminants and conditions at your tap."}
        </p>
      </div>
      {findings.length > 0 && (
        <div className="report-score">
          <strong>{Math.round((100 * within) / findings.length)}%</strong>
          <div>
            <h3>Confirmed results within reference</h3>
            <p>
              {within} of {findings.length} reviewed items met their individual
              checks. Uncertain items stay in the denominator. This percentage
              cannot predict whether water is safe to drink, bathe in, or cook
              with.
            </p>
          </div>
        </div>
      )}
      {groups.map(([category, title]) => {
        const items = findings.filter((item) => item.category === category);
        return (
          <section className="report-group" key={category}>
            <h3>
              {title} <span>({items.length})</span>
            </h3>
            {!items.length && <p>No reviewed items in this category.</p>}
            {items.map(({ row, meaning, reference }, index) => (
              <article className={"finding result-" + category} key={index}>
                <h4>
                  {row.analyte} · {row.period ? row.period + " " : ""}
                  {row.qualifier === "=" ? "" : row.qualifier}
                  {row.value} {row.unit}
                </h4>
                <p>{meaning}</p>
                {reference && <small>{reference}</small>}
              </article>
            ))}
          </section>
        );
      })}
      <details>
        <summary>Sources and how to read the categories</summary>
        <p>
          “Safe to use” applies to the listed measurement only. Health limits,
          appearance guidelines, and signs of bacterial contamination answer
          different questions. A missing test has no result to score. For
          private wells, confirm follow-up with your county health department.
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
