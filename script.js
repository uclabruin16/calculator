
function updateAirlines() {
  const client = document.getElementById("client").value;
  const airline = document.getElementById("airline");
  airline.innerHTML = "<option value=''>Select Airline</option>";

  if (client === "NAK") {
    airline.innerHTML += "<option value='JAL'>JAL</option><option value='NCA'>NCA</option>";
  } else if (client === "TK") {
    airline.innerHTML += "<option value='NCA'>NCA</option>";
  }
}

function toggleBoxCount() {
  const dg = document.getElementById("dg").value === "Yes";
  const dryIce = document.getElementById("dryIce").value === "Yes";
  const client = document.getElementById("client").value;
  const airline = document.getElementById("airline").value;
  const show = (client === "TK" && airline === "NCA" && (dg || dryIce)) || dg;
  document.getElementById("boxCountLabel").style.display = show ? "block" : "none";
}

function calculate() {
  const client = document.getElementById("client").value;
  const airline = document.getElementById("airline").value;
  const actualWeight = parseFloat(document.getElementById("actualWeight").value);
  const volume = parseFloat(document.getElementById("volume").value);
  const dg = document.getElementById("dg").value === "Yes";
  const dryIce = document.getElementById("dryIce").value === "Yes";
  const boxCount = parseInt(document.getElementById("boxCount").value) || 0;

  const usedWeight = Math.max(actualWeight, volume * 167);
  const mode = dryIce ? "dryIce" : dg ? "dg" : "regular";

  const output = document.getElementById("output");
  output.innerHTML = "";

  const baseRateTable = rateData[client][airline]["regular"] || [];
  const modeRateTable = rateData[client][airline][mode] || [];

  const rateTable = dg || dryIce
    ? baseRateTable.map((tier, i) => ({ ...tier, ...modeRateTable[i] }))
    : baseRateTable;

  if (!rateTable || !rateTable.length) {
    output.innerHTML = "<p>Rates not found for this configuration.</p>";
    return;
  }

  const matchedTier = rateTable.find(entry => {
    const label = entry.weight_tier.replace(/\s/g, '').toLowerCase();

    if (label.includes("1000kg<")) return usedWeight > 1000;
    if (label.includes("500kg<")) return usedWeight > 500 && usedWeight <= 1000;
    if (label.includes("300kg<")) return usedWeight > 300 && usedWeight <= 500;
    if (label.includes("100kg<")) return usedWeight > 100 && usedWeight <= 300;
    if (label.includes("45kg<")) return usedWeight > 45 && usedWeight <= 100;
    if (label.includes(">45kg")) return usedWeight <= 45;

    return false;
  }) || rateTable[rateTable.length - 1];

  let table = `
    <div class="mt-8 bg-white shadow-md rounded-lg overflow-hidden border">
      <table class="w-full text-sm text-left border-collapse">
        <thead class="bg-gray-100 font-semibold">
          <tr>
            <th class="p-3 border-b">Charge Type</th>
            <th class="p-3 border-b">Rate / Unit</th>
            <th class="p-3 border-b">Calculation</th>
            <th class="p-3 border-b text-right">Amount (USD)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">`;
  let total = 0;

  for (const [charge, data] of Object.entries(matchedTier)) {
    if (charge === "weight_tier") continue;
    if (charge === "raf_fee" && !dg) continue;
    if (charge === "dg_dec" && !dg) continue;
    if (charge === "label_inspection" && !(dg || dryIce)) continue;

    let amount = 0;
    let calc = "";
    if (data.unit === "per_kg") {
      amount = data.rate * usedWeight;
      calc = `${usedWeight.toFixed(2)} × ${data.rate}`;
    } else if (data.unit === "per_box") {
      if (charge === "raf_fee") {
        amount = Math.max(130, boxCount * data.rate);
        calc = `${boxCount} × ${data.rate} or $130 min`;
      } else {
        amount = data.rate * boxCount;
        calc = `${boxCount} × ${data.rate}`;
      }
    } else if (data.unit === "flat") {
      amount = data.rate;
      calc = "Flat";
    }
    total += amount;
    table += `<tr class="hover:bg-blue-50"><td class="p-2">${charge}</td><td class="p-2">${data.unit.replace('_', '/')}</td><td class="p-2">${calc}</td><td class="p-2 text-right">${amount.toFixed(2)}</td></tr>`;
  }

  table += `</tbody><tfoot><tr class="font-bold text-black border-t"><td class="p-3" colspan="3">Total</td><td class="p-3 text-right">${total.toFixed(2)}</td></tr></tfoot></table></div>`;
  output.innerHTML = table;
}

window.onload = function () {
  const clientSelect = document.getElementById("client");
  if (clientSelect.value) {
    updateAirlines();
  }
};
