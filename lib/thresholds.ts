export interface Row {
  analyte: string;
  value: string;
  unit: string;
  qualifier: string;
  source: string;
  uncertain?: boolean;
  period?: string;
}

export type Category = "safe" | "unsafe" | "unsure";
export interface Assessment {
  category: Category;
  meaning: string;
  reference?: string;
  healthEffect?: string;
}

const descriptions: Record<string, string> = {
  temperature:
    "This is how warm the water was when sampled. Temperature alone cannot tell you whether it is safe to drink.",
  color:
    "This measures visible tint. The report needs to identify the color scale before we can compare it with EPA’s appearance guideline.",
  "free carbon dioxide":
    "This is gas dissolved in the water. It can affect acidity. Read it alongside pH; this measurement alone does not give a drinking-water safety verdict.",
  "total alkalinity":
    "This tells you how strongly the water resists changes in acidity. It helps the utility manage treatment. It cannot tell you whether germs or harmful chemicals are present.",
  "total hardness":
    "Hardness mainly comes from calcium and magnesium. Harder water can leave scale on a kettle or faucet. Hardness alone cannot tell you whether water is safe to drink.",
  "specific conductivity":
    "Dissolved salts and minerals help water carry electricity. This reading measures that effect. It cannot identify which substances are present.",
  ammonia:
    "This is a nitrogen compound that matters to water treatment. Ask your utility how this level relates to its disinfection process.",
  silica:
    "Silica can enter water as it passes through rocks and soil. This tool has no drinking-water safety cutoff for this measurement.",
  "total trihalomethanes":
    "These compounds can form during disinfection. Ask the utility for the annual average at your distribution-system monitoring location. A plant-tap figure alone cannot establish compliance.",
};

interface Standard {
  limit: number;
  kind: "health" | "appearance" | "action";
  meaning: string;
}
const infantEffect =
  "Infants under six months can have trouble carrying oxygen in their blood. Shortness of breath or bluish skin after exposure needs emergency care.";
const healthEffects: Record<string, string> = {
  nitrate: infantEffect,
  nitrite: infantEffect,
  fluoride:
    "Long-term exposure to high levels can damage bones. Children’s developing teeth can become discolored.",
  lead: "Exposure can affect learning and development in children. In adults it can raise blood pressure and harm the kidneys.",
  arsenic:
    "Drinking water with too much arsenic over many years can damage skin and increase cancer risk.",
};
const standards: Record<string, Standard> = {
  iron: {
    limit: 0.3,
    kind: "appearance",
    meaning: "Iron can cause rusty stains or a metallic taste.",
  },
  manganese: {
    limit: 0.05,
    kind: "appearance",
    meaning: "Manganese can leave dark stains on fixtures.",
  },
  chloride: {
    limit: 250,
    kind: "appearance",
    meaning:
      "Chloride is a dissolved salt. High levels can make water taste salty.",
  },
  fluoride: {
    limit: 4,
    kind: "health",
    meaning:
      "Fluoride affects teeth. Too much over time can harm teeth or bones.",
  },
  nitrate: {
    limit: 10,
    kind: "health",
    meaning:
      "High nitrate is especially dangerous for infants under six months.",
  },
  nitrite: {
    limit: 1,
    kind: "health",
    meaning:
      "High nitrite can interfere with the blood’s ability to carry oxygen, especially in infants.",
  },
  lead: {
    limit: 0.015,
    kind: "action",
    meaning: "Lead can enter water from plumbing. EPA’s health goal is zero.",
  },
  arsenic: {
    limit: 0.01,
    kind: "health",
    meaning:
      "Arsenic can occur naturally in groundwater. Long-term exposure increases health risks.",
  },
  sulfate: {
    limit: 250,
    kind: "appearance",
    meaning: "Sulfate is a dissolved mineral that can affect taste.",
  },
  "total dissolved solids": {
    limit: 500,
    kind: "appearance",
    meaning:
      "This adds up dissolved material that can affect taste or leave deposits.",
  },
};

export function assess(row: Row): Assessment {
  let key = row.analyte.trim().toLowerCase();
  let unit = row.unit.trim().toLowerCase().replace(/[µμ]/g, "u");
  const value = row.value.trim();
  const q = row.qualifier;
  const unsure = (meaning: string, reference?: string): Assessment => ({
    category: "unsure",
    meaning,
    reference,
  });
  if (/^(total coliform(?: bacteria)?|e\.? coli|escherichia coli)$/.test(key)) {
    if (q !== "=" || !/^(absent|present)$/i.test(value))
      return unsure(
        "Ask whether the lab detected these bacteria in this sample.",
      );
    const ecoli = !key.startsWith("total");
    if (/^absent$/i.test(value))
      return {
        category: "safe",
        meaning:
          (ecoli
            ? "The lab did not find E. coli, a marker of fecal contamination."
            : "The lab did not find the indicator bacteria it looked for.") +
          " That is reassuring for this test at the sampled location.",
      };
    return ecoli
      ? {
          category: "unsafe",
          healthEffect:
            "Finding E. coli indicates possible fecal contamination. Germs in contaminated water can cause diarrhea, stomach cramps, or nausea.",
          meaning:
            "E. coli was found. If this is your drinking source, use an alternative safe supply and contact your utility or county health department now.",
        }
      : unsure(
          "The lab found indicator bacteria. This calls for follow-up testing, including E. coli. Ask your utility or health department for instructions before drinking it.",
        );
  }
  if (Object.hasOwn(descriptions, key)) return unsure(descriptions[key]);
  if (
    !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value) ||
    !Number.isFinite(Number(value)) ||
    !["=", "<", ">"].includes(q)
  )
    return unsure(
      "The value or comparison sign is unclear. Confirm it with the lab.",
    );
  const number = Number(value);
  if (key === "ph") {
    const reference = "EPA appearance and plumbing guideline · pH 6.5–8.5";
    if (
      !["units", "su", "s.u.", "ph units", "ph"].includes(unit) ||
      q !== "=" ||
      number > 14
    )
      return unsure(
        "Confirm the pH reading and units with the lab before using this comparison.",
        reference,
      );
    if (number < 6.5 || number > 8.5)
      return unsure(
        number < 6.5
          ? "This water is more acidic than recommended. It can corrode plumbing and release metals. Ask about lead and copper testing at your tap."
          : "This water is more alkaline than recommended and may leave deposits or taste different. Ask the utility what explains the reading.",
        reference,
      );
    const character =
      number === 7
        ? "neutral"
        : number < 7
          ? "slightly acidic"
          : "slightly alkaline";
    return {
      category: "safe",
      meaning: `A pH of ${value} is ${character} and within the recommended range. This reading gives you no pH-related reason to change how you use the water. Germs and chemicals need their own tests.`,
      reference,
    };
  }
  let multiplier = 1;
  let basis = "";
  if (/^(nitrate|nitrite)\b/.test(key)) {
    const name = key.startsWith("nitrate") ? "nitrate" : "nitrite";
    if (
      !/^(?:nitrate|nitrite)(?:-n| as (?:n|nitrogen|no[23])| \(as no[23]\)| \(no[23]\))?$/.test(
        key.replace(/₃/g, "3").replace(/₂/g, "2"),
      )
    )
      return unsure(
        "Ask the lab to confirm exactly which nitrogen compound or combination was measured.",
      );
    const ion = name === "nitrate" ? "no3" : "no2";
    const wording = (key + " " + unit).replace(/₃/g, "3").replace(/₂/g, "2");
    const asNitrogen =
      /(?:\bas (?:n|nitrogen)\b|(?:nitrate|nitrite|no[23])-n\b)/.test(wording);
    const asIon = new RegExp("(?:as |\\()" + ion + "\\b").test(wording);
    if (asNitrogen === asIon)
      return unsure(
        "The nitrogen reporting basis is unclear. Ask the lab whether this is measured as nitrogen or as the whole ion.",
      );
    if (asIon) multiplier = name === "nitrate" ? 0.2259 : 0.3045;
    key = name;
    unit = unit.replace(/ as (?:nitrogen|n|no[23])$/, "");
    basis = " as N";
  }
  const spec = Object.hasOwn(standards, key) ? standards[key] : undefined;
  if (!spec)
    return unsure(
      "This tool has no verified comparison for this item. Ask the lab what it measures and whether follow-up is needed.",
    );
  const factor = new Map([
    ["mg/l", 1],
    ["ppm", 1],
    ["ug/l", 0.001],
    ["ppb", 0.001],
  ]).get(unit);
  if (!factor)
    return unsure(
      spec.meaning + " Confirm the units before comparing this reading.",
    );
  const amount = number * factor * multiplier;
  const reference =
    (spec.kind === "health"
      ? "EPA health limit"
      : spec.kind === "action"
        ? "EPA public-system action level"
        : "EPA taste or appearance guideline") +
    " · " +
    spec.limit +
    " mg/L" +
    basis +
    (multiplier !== 1
      ? " · converted reading " +
        q +
        Number(amount.toPrecision(6)) +
        " mg/L as N"
      : "");
  const above =
    q === ">" ? amount >= spec.limit : q === "=" && amount > spec.limit;
  if (above && spec.kind !== "appearance")
    return {
      category: "unsafe",
      healthEffect: healthEffects[key],
      reference,
      meaning:
        key === "nitrate" || key === "nitrite"
          ? " The reading exceeds the drinking-water limit. If this is your supply, use a known safe source for infant formula and contact your utility or health department. Boiling does not remove nitrate or nitrite."
          : " The reading exceeds the screening reference. Use an alternative drinking source while your utility or health department advises you.",
    };
  if (q === ">" || (q === "<" && amount > spec.limit))
    return unsure(
      spec.meaning +
        " The reported bound leaves the actual concentration uncertain. Ask for a more precise result.",
      reference,
    );
  if (key === "lead")
    return unsure(
      spec.meaning +
        " An action level guides public-system treatment; a result below it cannot establish safe lead exposure at your tap.",
      reference,
    );
  if (above)
    return unsure(
      spec.meaning +
        " This exceeds the taste or appearance guideline. That calls for follow-up, but this guideline alone does not establish a health hazard.",
      reference,
    );
  if (key === "fluoride" && amount > 2)
    return unsure(
      spec.meaning +
        " The result can exceed the 2 mg/L guideline for tooth discoloration. Ask your provider about long-term use, especially for young children.",
      reference,
    );
  return {
    category: "safe",
    reference,
    meaning:
      spec.meaning +
      (q === "<"
        ? " The lab reported less than the displayed amount, which is within the comparison level."
        : " The reported level is within the reference for this item."),
  };
}
export function parseRows(text: string): Row[] {
  return text.split(/\r?\n/).flatMap((source) => {
    const line = source
      .replace(/^Private well,/i, "")
      .replace(/\s*\|\s*/g, " ")
      .trim();
    const match =
      /^([a-z][a-z ()\d-]*?)(?:\s+|\s*\.{2,}\s*|,)([<>=]?)\s*(\d+(?:\.\d+)?)(?:\s+|,)([^\s,]+)$/i.exec(
        line,
      );
    return match
      ? [
          {
            analyte: match[1].trim(),
            qualifier: match[2] || "=",
            value: match[3],
            unit: match[4],
            source,
          },
        ]
      : [];
  });
}
