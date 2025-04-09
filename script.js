
function calculate() {
  const client = document.getElementById("client").value;
  const airline = document.getElementById("airline").value;
  const dg = document.getElementById("dg").value === "Yes";
  const dryIce = document.getElementById("dryIce").value === "Yes";
  const boxCount = parseInt(document.getElementById("boxCount").value) || 0;

  const actualWeight = parseFloat(document.getElementById("weight").value) || 0;
  const volume = parseFloat(document.getElementById("volume").value) || 0;
  const volumetricWeight = volume * 167;
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  const baseRates = rates[client][airline];
  const dgRates = (baseRates && baseRates["DG"]) || {};
  const rateTable = { ...baseRates, ...dgRates };

  const tbody = document.querySelector("#resultTable tbody");
  tbody.innerHTML = "";

  let total = 0;

  for (const charge in rateTable) {
    const data = rateTable[charge];
    if (!data || !data.rate) continue;
    if (charge === "raf_fee" && !dg) continue;
    if (charge === "dg_dec" && !dg) continue;
    if (charge === "label_inspection" && !(dg || dryIce)) continue;

    let amount = 0;
    let calc = "";

    if (data.unit === "per_kg") {
      amount = chargeableWeight * data.rate;
      if (charge === "cartage") {
        amount = Math.max(data.min, amount);
        calc = `${chargeableWeight.toFixed(2)} × ${data.rate} (min ${data.min})`;
      } else {
        calc = `${chargeableWeight.toFixed(2)} × ${data.rate}`;
      }
    } else if (data.unit === "flat") {
      amount = data.rate;
      calc = "Flat";
    } else if (data.unit === "per_box") {
      if (charge === "raf_fee") {
        amount = Math.max(130, boxCount * data.rate);
        calc = `${boxCount} × ${data.rate} or $130 min`;
      } else {
        amount = data.rate * boxCount;
        calc = `${boxCount} × ${data.rate}`;
      }
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.label}</td>
      <td>${data.unit}</td>
      <td>${calc}</td>
      <td>${amount.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
    total += amount;
  }

  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
    <td><strong>Total</strong></td>
    <td></td>
    <td></td>
    <td><strong>${total.toFixed(2)}</strong></td>
  `;
  tbody.appendChild(totalRow);
}
