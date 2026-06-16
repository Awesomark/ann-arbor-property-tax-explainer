const inflationMultipliers = {
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
};

const countySelect = document.getElementById("countySelect");
const citySelect = document.getElementById("citySelect");
const villageSelect = document.getElementById("villageSelect");
const schoolSelect = document.getElementById("schoolSelect");
const purchaseYear = document.getElementById("purchaseYear");
const purchaseValue = document.getElementById("purchaseValue");
const taxRows = document.getElementById("taxRows");
const baselineText = document.getElementById("baselineText");
const dataStatus = document.getElementById("dataStatus");

let jurisdictions = [];

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

function displayVillage(value) {
  return value || "No village";
}

function uniqueSorted(rows, key) {
  return [...new Set(rows.map((row) => row[key]))].sort((a, b) =>
    displayVillage(a).localeCompare(displayVillage(b))
  );
}

function setOptions(select, values, formatter = (value) => value, preferred = "") {
  select.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(formatter(value))}</option>`)
    .join("");
  if (values.includes(preferred)) {
    select.value = preferred;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function filteredByCounty() {
  return jurisdictions.filter((row) => row.county === countySelect.value);
}

function filteredByCity() {
  return filteredByCounty().filter((row) => row.city === citySelect.value);
}

function filteredByVillage() {
  return filteredByCity().filter((row) => row.village === villageSelect.value);
}

function selectedJurisdiction() {
  return filteredByVillage().find((row) => row.school === schoolSelect.value);
}

function populateLocationControls(preferred = {}) {
  const counties = uniqueSorted(jurisdictions, "county");
  setOptions(countySelect, counties, undefined, preferred.county || "Washtenaw");

  const cities = uniqueSorted(filteredByCounty(), "city");
  setOptions(citySelect, cities, undefined, preferred.city || "Ann Arbor City");

  const villages = uniqueSorted(filteredByCity(), "village");
  setOptions(villageSelect, villages, displayVillage, preferred.village || "");

  const schools = uniqueSorted(filteredByVillage(), "school");
  setOptions(schoolSelect, schools, undefined, preferred.school || "ANN ARBOR PUBLIC SCHOOLS");
}

function refreshFromCounty() {
  populateLocationControls({ county: countySelect.value });
  refreshYears();
  render();
}

function refreshFromCity() {
  populateLocationControls({ county: countySelect.value, city: citySelect.value });
  refreshYears();
  render();
}

function refreshFromVillage() {
  populateLocationControls({
    county: countySelect.value,
    city: citySelect.value,
    village: villageSelect.value,
  });
  refreshYears();
  render();
}

function refreshYears(preferredYear = purchaseYear.value) {
  const jurisdiction = selectedJurisdiction();
  const years = jurisdiction ? jurisdiction.rates.map((rate) => rate[0]) : [];
  purchaseYear.innerHTML = years.map((year) => `<option value="${year}">${year}</option>`).join("");
  const numericPreferred = Number(preferredYear);
  purchaseYear.value = String(years.includes(numericPreferred) ? numericPreferred : years[0]);
}

function taxableValueForYear(currentTaxableValue, year, latestYear) {
  let taxableValue = currentTaxableValue;
  for (let inflationYear = latestYear; inflationYear > year; inflationYear -= 1) {
    taxableValue /= inflationMultipliers[inflationYear];
  }
  return taxableValue;
}

function buildRows(jurisdiction, startYear, currentTaxableValue) {
  const rates = new Map(jurisdiction.rates.map(([year, preRate]) => [year, preRate]));
  const years = jurisdiction.rates.map(([year]) => year).filter((year) => year >= startYear);
  const latestYear = years[years.length - 1];
  const startTaxableValue = taxableValueForYear(currentTaxableValue, startYear, latestYear);
  const baseMillage = rates.get(startYear);
  const baseTax = (startTaxableValue * baseMillage) / 1000;

  return years.map((year) => {
    const taxableValue = taxableValueForYear(currentTaxableValue, year, latestYear);
    const millage = rates.get(year);
    const taxes = (taxableValue * millage) / 1000;
    const inflationOnlyTax = (taxableValue * baseMillage) / 1000;
    const increase = taxes - baseTax;
    const inflationDollars = inflationOnlyTax - baseTax;
    const millageDollars = taxes - inflationOnlyTax;

    return {
      year,
      irm: inflationMultipliers[year],
      taxableValue,
      millage,
      taxes,
      increase,
      inflationDollars,
      millageDollars,
    };
  });
}

function render() {
  const jurisdiction = selectedJurisdiction();
  if (!jurisdiction) return;

  const startYear = parseNumber(purchaseYear.value, jurisdiction.rates[0][0]);
  const currentTaxableValue = parseNumber(purchaseValue.value, 50000);
  const rows = buildRows(jurisdiction, startYear, currentTaxableValue);
  const latest = rows[rows.length - 1];
  const baseline = rows[0];
  const villageText = jurisdiction.village ? `, ${jurisdiction.village}` : "";

  baselineText.textContent =
    `${jurisdiction.county} County, ${jurisdiction.city}${villageText}, ${jurisdiction.school}. ` +
    `${latest.year} taxable value ${money.format(currentTaxableValue)}, ` +
    `estimated ${startYear} taxable value ${money.format(baseline.taxableValue)}, ` +
    `PRE millage ${rows[0].millage.toFixed(4)}`;

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
          <td class="${signedClass(row.inflationDollars)}">${moneyExact.format(row.inflationDollars)}</td>
          <td class="${signedClass(row.millageDollars)}">${moneyExact.format(row.millageDollars)}</td>
        </tr>
      `
    )
    .join("");

  document.getElementById("currentYearLabel").textContent = `${latest.year} modeled tax`;
  document.getElementById("latestTax").textContent = money.format(latest.taxes);
  document.getElementById("latestChange").textContent =
    `${money.format(latest.increase)} from first full year of ownership (${startYear})`;
  document.getElementById("latestInflationAmount").textContent = money.format(latest.inflationDollars);
  document.getElementById("latestRateAmount").textContent = money.format(latest.millageDollars);
  setUrlState(startYear, currentTaxableValue, jurisdiction);
}

function setUrlState(year, value, jurisdiction) {
  const url = new URL(window.location.href);
  url.searchParams.set("county", jurisdiction.county);
  url.searchParams.set("city", jurisdiction.city);
  url.searchParams.set("village", jurisdiction.village);
  url.searchParams.set("school", jurisdiction.school);
  url.searchParams.set("year", year);
  url.searchParams.set("value", Math.round(value));
  history.replaceState(null, "", url);
}

async function initialize() {
  const params = new URLSearchParams(window.location.search);
  const response = await fetch("millage-rates.json");
  const data = await response.json();
  jurisdictions = data.jurisdictions;

  populateLocationControls({
    county: params.get("county") || "Washtenaw",
    city: params.get("city") || "Ann Arbor City",
    village: params.get("village") || "",
    school: params.get("school") || "ANN ARBOR PUBLIC SCHOOLS",
  });
  refreshYears(params.get("year") || "2005");
  purchaseValue.value = parseNumber(params.get("value"), 50000);
  dataStatus.textContent = `${jurisdictions.length.toLocaleString()} tax jurisdictions loaded.`;

  countySelect.addEventListener("change", refreshFromCounty);
  citySelect.addEventListener("change", refreshFromCity);
  villageSelect.addEventListener("change", refreshFromVillage);
  schoolSelect.addEventListener("change", () => {
    refreshYears();
    render();
  });
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

initialize().catch((error) => {
  console.error(error);
  dataStatus.textContent = "Could not load the statewide millage-rate data.";
});
