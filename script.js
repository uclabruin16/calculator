
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

  if (!rateData[client] || !rateData[client][airline] || !rateData[client][airline][mode]) {
    output.innerHTML = "<p>Rates not found for this configuration.</p>";
    return;
  }

  const rateTable = rateData[client][airline][mode];
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

  let table = "<table><tr><th>Charge Type</th><th>Rate / Unit</th><th>Calculation</th><th>Amount (USD)</th></tr>";
  let total = 0;

  for (const [charge, data] of Object.entries(matchedTier)) {
    if (charge === "weight_tier") continue;
    let amount = 0;
    let calc = "";
    if (data.unit === "per_kg") {
      amount = data.rate * usedWeight;
      calc = `${usedWeight.toFixed(2)} × ${data.rate}`;
    } else if (data.unit === "per_box") {
      amount = data.rate * boxCount;
      calc = `${boxCount} × ${data.rate}`;
    } else if (data.unit === "flat") {
      amount = data.rate;
      calc = "Flat";
    }
    total += amount;
    table += `<tr><td>${charge}</td><td>${data.unit.replace('_', '/')}</td><td>${calc}</td><td>${amount.toFixed(2)}</td></tr>`;
  }

  table += `<tr><th colspan="3">Total</th><th>${total.toFixed(2)}</th></tr></table>`;
  output.innerHTML = table;
}

// Auto-trigger airline population on page load if client is already selected
window.onload = function () {
  const clientSelect = document.getElementById("client");
  if (clientSelect.value) {
    updateAirlines();
  }
};
