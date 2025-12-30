import { getDateRange, parseDateAsLondon } from "./londonTime.js";
import { getOrdersDataVersion, readOrdersData } from "./orders-data-store.js";

const aggregationCache = new Map();
let parsedCache = { version: null, data: [] };

function parseGBP(value) {
  if (value === null || value === undefined) return 0;
  const s = value.toString().replace(/[£$,]/g, "").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function readOrdersDataCached() {
  const version = getOrdersDataVersion();

  if (parsedCache.version === version && Array.isArray(parsedCache.data)) {
    return parsedCache.data;
  }

  const data = readOrdersData();
  parsedCache = { version, data };
  return data;
}

export function getAggregatedData(filterFn, cacheKey) {
  const dataVersion = getOrdersDataVersion();
  const cacheEntry = aggregationCache.get(cacheKey);

  if (cacheEntry?.version === dataVersion) {
    return cacheEntry.data;
  }

  const data = readOrdersDataCached().filter(filterFn);
  aggregationCache.set(cacheKey, { version: dataVersion, data });
  return data;
}

export function getQuotes() {
  return getAggregatedData((x) => x?.type === "quotes", "records:quotes");
}

export function getPendingClaims() {
  return getAggregatedData((x) => x?.type === "pendingClaims", "records:pendingClaims");
}

export function getCompletedClaims() {
  return getAggregatedData((x) => x?.type === "completedClaims", "records:completedClaims");
}

export function getActivePolicies() {
  return getAggregatedData(
    (x) => x?.type === "annual" || x?.type === "temporary" || x?.type === "impound",
    "records:policies:active",
  );
}

export function getAllPolicies() {
  return getAggregatedData(
    (x) =>
      x?.type === "annual" ||
      x?.type === "temporary" ||
      x?.type === "impound" ||
      x?.type === "expired-annual" ||
      x?.type === "expired-temporary" ||
      x?.type === "expired-impound",
    "records:policies:all",
  );
}

export function getCountsForRanges(records, dateSelector) {
  const ranges = {
    today: getDateRange("today"),
    last7Days: getDateRange("last7days"),
    last30Days: getDateRange("last30days"),
  };

  const counts = {
    today: 0,
    last7Days: 0,
    last30Days: 0,
  };

  if (!Array.isArray(records)) return counts;

  records.forEach((record) => {
    const dateStr = dateSelector(record);
    const d = parseDateAsLondon(dateStr);
    if (!d) return;

    if (d >= ranges.today.start && d <= ranges.today.end) counts.today += 1;
    if (d >= ranges.last7Days.start && d <= ranges.last7Days.end) counts.last7Days += 1;
    if (d >= ranges.last30Days.start && d <= ranges.last30Days.end) counts.last30Days += 1;
  });

  return counts;
}

export function getComputedData(cacheKey, computeFn) {
  const dataVersion = getOrdersDataVersion();
  const cacheEntry = aggregationCache.get(cacheKey);

  if (cacheEntry?.version === dataVersion) {
    return cacheEntry.data;
  }

  const data = computeFn();
  aggregationCache.set(cacheKey, { version: dataVersion, data });
  return data;
}

export function buildMonthlyCounts(records, dateSelector, year) {
  const monthlyCounts = Array.from({ length: 12 }, () => 0);

  records.forEach((record) => {
    const dateStr = dateSelector(record);
    const d = parseDateAsLondon(dateStr);
    if (!d) return;

    if (d.getFullYear() !== year) return;

    monthlyCounts[d.getMonth()] += 1;
  });

  return monthlyCounts;
}

export function sumRevenue(records, priceSelector) {
  let total = 0;

  records.forEach((record) => {
    total += parseGBP(priceSelector(record));
  });

  return total;
}

export function sumRevenueInRange(records, priceSelector, dateSelector, range) {
  let total = 0;

  records.forEach((record) => {
    const d = parseDateAsLondon(dateSelector(record));
    if (!d) return;

    if (d >= range.start && d <= range.end) {
      total += parseGBP(priceSelector(record));
    }
  });

  return total;
}

export const __dashboardDataInternals = {
  aggregationCache,
};
