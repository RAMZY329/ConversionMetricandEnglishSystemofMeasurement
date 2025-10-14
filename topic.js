let currentTopic = "metric_conversion"; // default to Metric System conversions (length, weight, volume)

// Problem generators
const ProblemGenerator = {
  // Metric conversions: length, weight, volume
  metric_conversion: () => {
    // Helpers
    function randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function roundTo(n, decimals) {
      const p = Math.pow(10, decimals || 0);
      return Math.round(n * p) / p;
    }

    // Define unit groups and multipliers following the exact chains provided
    // Metric base units: meter (m), gram (g), liter (L)
    // Also include English/Imperial groups for Length, Weight, and Volume
    const groups = [
      {
        name: "Metric Length",
        // mm -> cm -> dm -> m -> dam -> hm -> km (each step x10)
        units: [
          { name: "mm", toBase: 0.001 },
          { name: "cm", toBase: 0.01 },
          { name: "dm", toBase: 0.1 },
          { name: "m", toBase: 1 },
          { name: "dam", toBase: 10 },
          { name: "hm", toBase: 100 },
          { name: "km", toBase: 1000 },
        ],
      },
      {
        name: "Metric Mass",
        // mg -> cg -> dg -> g -> dag -> hg -> kg (each step x10)
        units: [
          { name: "mg", toBase: 0.001 },
          { name: "cg", toBase: 0.01 },
          { name: "dg", toBase: 0.1 },
          { name: "g", toBase: 1 },
          { name: "dag", toBase: 10 },
          { name: "hg", toBase: 100 },
          { name: "kg", toBase: 1000 },
        ],
      },
      {
        name: "Metric Volume",
        // mL -> cL -> dL -> L -> daL -> hL -> kL (each step x10)
        units: [
          { name: "mL", toBase: 0.001 },
          { name: "cL", toBase: 0.01 },
          { name: "dL", toBase: 0.1 },
          { name: "L", toBase: 1 },
          { name: "daL", toBase: 10 },
          { name: "hL", toBase: 100 },
          { name: "kL", toBase: 1000 },
        ],
      },
      {
        name: "English Length",
        // Use inch as the base unit for this group: in, ft, yd, mi
        // 1 ft = 12 in, 1 yd = 3 ft = 36 in, 1 mi = 5280 ft = 63360 in
        units: [
          { name: "in", toBase: 1 },
          { name: "ft", toBase: 12 },
          { name: "yd", toBase: 36 },
          { name: "mi", toBase: 63360 },
        ],
      },
      {
        name: "English Weight",
        // Use ounce (oz) as base: 1 lb = 16 oz, 1 ton = 2000 lb = 32000 oz
        units: [
          { name: "oz", toBase: 1 },
          { name: "lb", toBase: 16 },
          { name: "ton", toBase: 32000 },
        ],
      },
      {
        name: "English Volume",
        // Use teaspoon (tsp) as base. Standard US customary relationships:
        // 1 tbsp = 3 tsp, 1 fl oz = 2 tbsp = 6 tsp, 1 cup (c) = 8 fl oz = 48 tsp
        // 1 pt = 2 c = 96 tsp, 1 qt = 2 pt = 4 c = 192 tsp, 1 gal = 4 qt = 768 tsp
        units: [
          { name: "tsp", toBase: 1 },
          { name: "tbsp", toBase: 3 },
          { name: "fl oz", toBase: 6 },
          { name: "c", toBase: 48 },
          { name: "pt", toBase: 96 },
          { name: "qt", toBase: 192 },
          { name: "gal", toBase: 768 },
        ],
      },
    ];

    // Pick a random group and two different units from it
    const grp = groups[Math.floor(Math.random() * groups.length)];
    const fromIdx = randInt(0, grp.units.length - 1);
    let toIdx = randInt(0, grp.units.length - 1);
    while (toIdx === fromIdx) {
      toIdx = randInt(0, grp.units.length - 1);
    }

    const from = grp.units[fromIdx];
    const to = grp.units[toIdx];

    // Choose a base numeric value that's sensible depending on units
    // Use different ranges to avoid very tiny/huge answers
    let value;
    if (from.toBase >= 1000) {
      // from is large (e.g., km, t) -> pick small integer
      value = roundTo(Math.random() * 50 + 1, 3); // 1..51
    } else if (from.toBase <= 0.001) {
      // from is very small (e.g., mm, mg, mL) -> pick larger integer
      value = roundTo(Math.random() * 500 + 10, 3); // 10..510
    } else {
      value = roundTo(Math.random() * 200 + 1, 3); // 1..201
    }

    // Compute in base unit then convert to target
    const base = value * from.toBase; // value in base units
    const rawAnswer = base / to.toBase;

    // Format question and sensible rounding for display
    const roundedAnswer = roundTo(rawAnswer, 3);

    // Remove unnecessary .0 or trailing zeros when possible for nicer options
    function fmtNumber(n) {
      if (Number.isInteger(n)) return `${n}`;
      return `${n}`.replace(/(?:\.0+|(?<=\.[0-9]*[1-9])0+)$/, "");
    }

    const question = `Convert ${fmtNumber(value)} ${from.name} to ${to.name} (${grp.name})`;

    return { question, answer: roundedAnswer };
  },
};

function loadTopic() {
  const section = document.getElementById("topic-section");
  currentTopic = "metric_conversion"; // set when topic is opened

  section.innerHTML = `
    <h2>🔁 Unit Conversions: Metric & English Systems</h2>

    <div style="background: linear-gradient(135deg, #e8f5ff, #e0f7fa); padding: 1.5rem; border-radius: 12px; margin: 1rem 0; border-left: 5px solid #0288d1;">
      <h3 style="color: #0277bd; margin-bottom: 1rem;">🎯 What You'll Learn</h3>
      <p style="margin-bottom: 0.5rem;">Practice converting between units in both the Metric system (length, mass, volume) and common English/US customary units (length, weight, volume). Problems will ask you to convert a value from one unit to another and choose the correct numeric answer.</p>
    </div>

    <h3 style="color: #2c3e50; margin: 1rem 0 0.5rem;">📐 Quick Tips</h3>
    <div style="background: #f1f8e9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #7cb342;">
      <ul>
        <li>All metric prefixes are powers of ten. Move decimal places when converting (e.g., 1 km = 1000 m).</li>
        <li>To convert from A to B: convert A to the base unit (meters, grams, liters) then to unit B using the known multipliers.</li>
        <li>Answers are rounded to at most three decimals when necessary.</li>
      </ul>
    </div>

    <h3 style="color: #2c3e50; margin: 1rem 0 0.5rem;">💡 Examples</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
      <div style="background: #fff3e0; padding: 1rem; border-radius: 8px; border-left: 4px solid #fb8c00;">
        <h4 style="color: #ef6c00; margin-bottom: 0.5rem;">Metric Length</h4>
        <p><strong>Convert 1500 m to km → 1.5 km</strong></p>
        <p><em>Explanation: divide by 1000 because 1 km = 1000 m.</em></p>
      </div>
      <div style="background: #e8f5e9; padding: 1rem; border-radius: 8px; border-left: 4px solid #43a047;">
        <h4 style="color: #2e7d32; margin-bottom: 0.5rem;">Metric Mass</h4>
        <p><strong>Convert 2000 g to kg → 2 kg</strong></p>
        <p><em>Explanation: 1000 g = 1 kg, so divide by 1000.</em></p>
      </div>
      <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; border-left: 4px solid #1e88e5;">
        <h4 style="color: #1565c0; margin-bottom: 0.5rem;">Metric Volume</h4>
        <p><strong>Convert 2500 mL to L → 2.5 L</strong></p>
        <p><em>Explanation: 1000 mL = 1 L, so divide by 1000.</em></p>
      </div>
      <div style="background: #fff8e1; padding: 1rem; border-radius: 8px; border-left: 4px solid #f39c12;">
        <h4 style="color: #f57c00; margin-bottom: 0.5rem;">English/US Units</h4>
        <p><strong>Convert 3 ft to in → 36 in</strong></p>
        <p><em>Explanation: 1 ft = 12 in, so multiply 3 × 12 = 36.</em></p>
      </div>
    </div>

    <div style="background: #f3e5f5; padding: 1rem; border-radius: 12px; margin-top: 1rem; border-left: 5px solid #8e24aa;">
      <h3 style="color: #6a1b9a; margin-bottom: 0.5rem;">🎮 Ready to Practice?</h3>
      <p>The app will generate problems like <code>Convert 2500 mL to L</code> or <code>Convert 3.2 km to m</code> with multiple choice answers. Answers may be rounded to 3 decimal places.</p>
      <p style="margin-top: 0.5rem;">• <strong>Practice Mode:</strong> timed individual practice with score</p>
      <p>• <strong>Competition Mode:</strong> multiplayer rounds with keyboard shortcuts</p>
    </div>

    <!-- Reference Section -->
    <div style="background: #ffffff; padding: 1rem; border-radius: 12px; margin-top: 1rem; border-left: 5px solid #607d8b;">
      <h3 style="color: #37474f; margin-bottom: 0.5rem;">📚 Reference: Metric & English/US Relationships</h3>

      <h4 style="margin: 0.5rem 0 0.25rem;">Metric (Length)</h4>
      <p style="margin: 0 0 0.5rem;">1 mm = 0.001 m — chain: 10 mm = 1 cm, 10 cm = 1 dm, 10 dm = 1 m, 10 m = 1 dam, 10 dam = 1 hm, 10 hm = 1 km</p>

      <h4 style="margin: 0.5rem 0 0.25rem;">Metric (Mass)</h4>
      <p style="margin: 0 0 0.5rem;">Chain: 10 mg = 1 cg, 10 cg = 1 dg, 10 dg = 1 g, 10 g = 1 dag, 10 dag = 1 hg, 10 hg = 1 kg</p>

      <h4 style="margin: 0.5rem 0 0.25rem;">Metric (Volume)</h4>
      <p style="margin: 0 0 0.5rem;">Chain: 10 mL = 1 cL, 10 cL = 1 dL, 10 dL = 1 L, 10 L = 1 daL, 10 daL = 1 hL, 10 hL = 1 kL</p>

      <h4 style="margin: 0.5rem 0 0.25rem;">English/US (Length)</h4>
      <p style="margin: 0 0 0.5rem;">1 ft = 12 in; 1 yd = 3 ft; 1 mi = 5280 ft</p>

      <h4 style="margin: 0.5rem 0 0.25rem;">English/US (Weight)</h4>
      <p style="margin: 0 0 0.5rem;">1 lb = 16 oz; 1 ton = 2000 lb</p>

      <h4 style="margin: 0.5rem 0 0.25rem;">English/US (Volume)</h4>
      <p style="margin: 0 0 0.5rem;">Common relationships (US): 1 tbsp = 3 tsp; 1 fl oz = 2 tbsp; 1 cup (c) = 8 fl oz; 1 pt = 2 c; 1 qt = 2 pt; 1 gal = 4 qt. (Derived: 1 c = 48 tsp, etc.)</p>

      <p style="margin-top: 0.5rem; color:#555; font-size:0.95rem;"><em>Tip: When converting, convert to a common base (meters, grams, liters, inches, ounces, or teaspoons), then convert to the target unit.</em></p>
    </div>
  `;
}

// Always returns a valid problem
// Always returns a valid problem object: { question: string, answer: number }
function getProblem() {
  if (!currentTopic) {
    currentTopic = "metric_conversion"; // fallback
  }
  return ProblemGenerator[currentTopic]();
}
