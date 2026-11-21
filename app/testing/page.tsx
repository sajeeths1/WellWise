"use client";
import Link from "next/link";
import { useState } from "react";
import { useWell } from "../workspace";

const contacts: Record<string, { phone: string; display: string }> = {
  Wake: { phone: "9198939355", display: "919-893-WELL (9355)" },
  Franklin: { phone: "9194968100", display: "919-496-8100" },
};
export default function Testing() {
  const { county, setCounty, observation } = useWell();
  const [message, setMessage] = useState("");
  const contact = contacts[county];
  const request = [
    "I use a private well in " +
      (contact ? county + " County" : "North Carolina") +
      ".",
    observation?.description,
    observation?.change === "Yes" ? "This is a change from usual." : "",
    "How can I arrange water testing, and how should I collect a sample?",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <>
      <div className="heading">
        <h1>Local testing</h1>
        <p>Find the right contact for the county where your well is located.</p>
      </div>
      <div className="two-col">
        <section className="panel form">
          <h2>Your testing contact</h2>
          <label htmlFor="county">Well location</label>
          <select
            id="county"
            value={county}
            onChange={(e) => {
              setCounty(e.target.value);
              setMessage("");
            }}
          >
            <option value="">Select your county</option>
            <option>Wake</option>
            <option>Franklin</option>
            <option value="Other">Another NC county</option>
          </select>
          {contact ? (
            <>
              <h3>{county} County Environmental Health</h3>
              <a className="phone" href={"tel:+1" + contact.phone}>
                {contact.display}
              </a>
              <a
                className="text-link"
                href="https://www.ncdhhs.gov/divisions/health-service-regulation/north-carolina-radon-program/radon-well-water"
              >
                Contact source · NC DHHS ↗
              </a>
            </>
          ) : (
            <a
              className="text-link"
              href="https://www.dph.ncdhhs.gov/local-health-departments"
            >
              NC health department directory ↗
            </a>
          )}
        </section>
        <section className="panel form">
          <h2>Your testing request</h2>
          <p>Use this when calling or writing to the county.</p>
          <blockquote>{request}</blockquote>
          <button
            className="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(request);
                setMessage("Copied to clipboard.");
              } catch {
                setMessage("Select the request above and copy it manually.");
              }
            }}
          >
            Copy request
          </button>
          <span role="status">{message}</span>
        </section>
      </div>
      <div className="demo">
        <div>
          <h3>Have your results?</h3>
          <p>Review your lab report or try the synthetic metals panel.</p>
        </div>
        <Link className="text-link" href="/reports">
          Open lab reports →
        </Link>
      </div>
    </>
  );
}
