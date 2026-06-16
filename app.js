const inflationMultipliers = {
  1995: 1.026,
  1996: 1.028,
  1997: 1.028,
  1998: 1.027,
  1999: 1.016,
  2000: 1.019,
  2001: 1.032,
  2002: 1.032,
  2003: 1.015,
  2004: 1.023,
  2005: 1.023,
  2006: 1.033,
  2007: 1.037,
  2008: 1.023,
  2009: 1.044,
  2010: 0.997,
  2011: 1.017,
  2012: 1.027,
  2013: 1.024,
  2014: 1.016,
  2015: 1.016,
  2016: 1.003,
  2017: 1.009,
  2018: 1.021,
  2019: 1.024,
  2020: 1.019,
  2021: 1.014,
  2022: 1.033,
  2023: 1.05,
  2024: 1.05,
  2025: 1.031,
  2026: 1.027,
};

const annArborPreMillage = {
  1995: 50.4221,
  1996: 47.8084,
  1997: 49.7825,
  1998: 49.3022,
  1999: 48.3181,
  2000: 47.4614,
  2001: 46.802,
  2002: 47.5568,
  2003: 45.4418,
  2004: 47.3625,
  2005: 46.7755,
  2006: 46.1895,
  2007: 46.0373,
  2008: 45.6098,
  2009: 45.1876,
  2010: 45.4283,
  2011: 45.3008,
  2012: 45.6579,
  2013: 45.0315,
  2014: 46.3587,
  2015: 46.3262,
  2016: 47.7702,
  2017: 49.0725,
  2018: 49.4086,
  2019: 48.9396,
  2020: 50.4649,
  2021: 50.7948,
  2022: 50.3592,
  2023: 51.259,
  2024: 53.0378,
  2025: 52.6657,
};

const availableYears = Object.keys(annArborPreMillage)
  .map(Number)
  .sort((a, b) => a - b);
const lastModeledYear = availableYears[availableYears.length - 1];

const purchaseYear = document.getElementById("purchaseYear");
const purchaseValue = document.getElementById("purchaseValue");
const taxRows = document.getElementById("taxRows");
const baselineText = document.getElementById("baselineText");

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const moneyExact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function pct(value) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function signedClass(value) {
  if (value < 0) return "negative";
  if (value > 0) return "positive";
  return "zero";
}

function parseNumber(value, fallback) {
  if (value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function setUrlState(year, value) {
  const url = new URL(window.location.href);
  url.searchParams.set("year", year);
  url.searchParams.set("value", Math.round(value));
  history.replaceState(null, "", url);
}

function buildRows(startYear, startingTaxableValue) {
  const baseMillage = annArborPreMillage[startYear];
  const baseTax = (startingTaxableValue * baseMillage) / 1000;
  let taxableValue = startingTaxableValue;

  return availableYears
    .filter((year) => year >= startYear)
    .map((year) => {
      if (year > startYear) {
        taxableValue *= inflationMultipliers[year];
      }

      const millage = annArborPreMillage[year];
      const taxes = (taxableValue * millage) / 1000;
      const inflationOnlyTax = (taxableValue * baseMillage) / 1000;
      const increase = taxes - baseTax;
      const inflationDollars = inflationOnlyTax - baseTax;
      const millageDollars = taxes - inflationOnlyTax;
      const inflationShare = increase === 0 ? 0 : (inflationDollars / increase) * 100;
      const rateShare = increase === 0 ? 0 : (millageDollars / increase) * 100;

      return {
        year,
        irm: inflationMultipliers[year],
        taxableValue,
        millage,
        taxes,
        increase,
        inflationDollars,
        millageDollars,
        inflationShare,
        rateShare,
      };
    });
}

function render() {
  const startYear = parseNumber(purchaseYear.value, 1995);
  const startingTaxableValue = parseNumber(purchaseValue.value, 50000);
  const rows = buildRows(startYear, startingTaxableValue);
  const baselineMillage = annArborPreMillage[startYear];
  const latest = rows[rows.length - 1];

  baselineText.textContent =
    `Baseline: ${startYear} taxable value ${money.format(startingTaxableValue)}, ` +
    `PRE millage ${baselineMillage.toFixed(4)}`;

  taxRows.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <th scope="row">${row.year}</th>
          <td>${row.irm.toFixed(3)}</td>
          <td>${money.format(row.taxableValue)}</td>
          <td>${row.millage.toFixed(4)}</td>
          <td>${moneyExact.format(row.taxes)}</td>
          <td class="${signedClass(row.increase)}">${moneyExact.format(row.increase)}</td>
          <td class="${signedClass(row.inflationDollars)}">${impactCell(row.inflationDollars, row.inflationShare)}</td>
          <td class="${signedClass(row.millageDollars)}">${impactCell(row.millageDollars, row.rateShare)}</td>
        </tr>
      `
    )
    .join("");

  document.getElementById("currentYearLabel").textContent = `${lastModeledYear} modeled tax`;
  document.getElementById("latestTax").textContent = money.format(latest.taxes);
  document.getElementById("latestChange").textContent =
    `${money.format(latest.increase)} from ${startYear}`;
  document.getElementById("latestInflationAmount").textContent = money.format(latest.inflationDollars);
  document.getElementById("latestInflationShare").textContent = pct(latest.inflationShare);
  document.getElementById("latestRateAmount").textContent = money.format(latest.millageDollars);
  document.getElementById("latestRateShare").textContent = pct(latest.rateShare);

  setUrlState(startYear, startingTaxableValue);
}

function initialize() {
  const params = new URLSearchParams(window.location.search);
  const selectedYear = parseNumber(params.get("year"), 1995);
  const selectedValue = parseNumber(params.get("value"), 50000);

  purchaseYear.innerHTML = availableYears
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
  purchaseYear.value = String(availableYears.includes(selectedYear) ? selectedYear : 1995);
  purchaseValue.value = selectedValue;

  purchaseYear.addEventListener("change", render);
  purchaseValue.addEventListener("input", render);
  document.getElementById("copyLink").addEventListener("click", async () => {
    const button = document.getElementById("copyLink");
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Use address bar";
    }
    window.setTimeout(() => {
      button.textContent = "Copy link";
    }, 1200);
  });

  render();
}

function impactCell(amount, share) {
  return `<span class="impact-amount">${moneyExact.format(amount)}</span><small>${pct(share)}</small>`;
}

initialize();
