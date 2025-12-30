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

function cloneDate(date) {
  return new Date(date.getTime());
}

function buildPreviousRange(range) {
  const duration = range.end.getTime() - range.start.getTime();
  const previousEnd = new Date(range.start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return {
    start: cloneDate(previousStart),
    end: cloneDate(previousEnd),
  };
}

export function buildRangePairs(rangeTypes = ["today", "last7days", "last30days"]) {
  const pairs = {};

  rangeTypes.forEach((type) => {
    const current = getDateRange(type);
    if (!current) return;
    pairs[type] = {
      current,
      previous: buildPreviousRange(current),
    };
  });

  return pairs;
}

export function calculatePercentChange(current, previous) {
  if (!Number.isFinite(current)) current = 0;
  if (!Number.isFinite(previous) || previous === 0) {
    if (current === 0) return 0;
    return 100;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
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

export function getCountsWithTrends(records, dateSelector) {
  const rangePairs = buildRangePairs(["today", "last7days", "last30days"]);
  const buckets = Object.fromEntries(
    Object.keys(rangePairs).map((key) => [key, { current: 0, previous: 0 }]),
  );

  if (Array.isArray(records)) {
    records.forEach((record) => {
      const dateStr = dateSelector(record);
      const date = parseDateAsLondon(dateStr);
      if (!date) return;

      Object.entries(rangePairs).forEach(([key, range]) => {
        const bucket = buckets[key];
        if (!bucket) return;

        if (date >= range.current.start && date <= range.current.end) {
          bucket.current += 1;
        } else if (date >= range.previous.start && date <= range.previous.end) {
          bucket.previous += 1;
        }
      });
    });
  }

  const counts = {
    today: buckets.today?.current || 0,
    last7Days: buckets.last7days?.current || 0,
    last30Days: buckets.last30days?.current || 0,
  };

  const trends = {
    today: calculatePercentChange(buckets.today?.current || 0, buckets.today?.previous || 0),
    last7Days: calculatePercentChange(
      buckets.last7days?.current || 0,
      buckets.last7days?.previous || 0,
    ),
    last30Days: calculatePercentChange(
      buckets.last30days?.current || 0,
      buckets.last30days?.previous || 0,
    ),
  };

  return { counts, trends };
}

export function getCountsForRanges(records, dateSelector) {
  return getCountsWithTrends(records, dateSelector).counts;
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
