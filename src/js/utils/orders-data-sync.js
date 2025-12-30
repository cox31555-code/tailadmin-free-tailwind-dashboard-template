import {
  annualTableConfig,
  temporaryTableConfig,
  impoundTableConfig,
  quotesTableConfig,
  pendingClaimsTableConfig,
  completedClaimsTableConfig,
} from "./table-configs.js";

import { extractRowData } from "./table-functions.js";
import { mergeOrdersData, readOrdersData } from "./orders-data-store.js";
import { getLondonToday, parseDateAsLondon } from "./londonTime.js";

const SOURCES = [
  { url: "/annual.html", config: annualTableConfig },
  { url: "/temporary.html", config: temporaryTableConfig },
  { url: "/impound.html", config: impoundTableConfig },
  { url: "/quotes.html", config: quotesTableConfig },
  { url: "/pending-claims.html", config: pendingClaimsTableConfig },
  { url: "/completed-claims.html", config: completedClaimsTableConfig },
];

const REQUIRED_TYPES = [
  "annual",
  "temporary",
  "impound",
  "quotes",
  "pendingClaims",
  "completedClaims",
  // expired-* types are derived (see below)
  "expired-annual",
  "expired-temporary",
  "expired-impound",
];

let ensurePromise = null;

function getPresentTypes() {
  const orders = readOrdersData();
  const set = new Set();
  orders.forEach((o) => {
    if (o?.type) set.add(o.type);
  });
  return set;
}

function isComplete() {
  const types = getPresentTypes();
  return REQUIRED_TYPES.every((t) => types.has(t));
}

function parseHtmlTableRows(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return Array.from(doc.querySelectorAll("table tbody tr"));
}

function rowHasCells(row) {
  try {
    return row && row.querySelectorAll && row.querySelectorAll("td").length > 0;
  } catch {
    return false;
  }
}

function deriveExpiredPolicies(policies) {
  const today = getLondonToday();
  const expired = [];

  policies.forEach((p) => {
    const baseType = p?.type;
    if (baseType !== "annual" && baseType !== "temporary" && baseType !== "impound") return;

    const endDateStr = p.policyEnd;
    if (!endDateStr) return;

    const end = parseDateAsLondon(endDateStr);
    if (!end) return;

    // Treat as expired if end date is strictly before today.
    if (end.getTime() < today.getTime()) {
      expired.push({ ...p, type: `expired-${baseType}` });
    }
  });

  return expired;
}

async function fetchAndExtract(url, config) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) return [];

  const html = await response.text();
  const rows = parseHtmlTableRows(html);

  const items = [];
  rows.forEach((row) => {
    if (!rowHasCells(row)) return;

    try {
      const data = extractRowData(row, config);
      if (data && typeof data === "object") items.push(data);
    } catch {
      // ignore malformed rows
    }
  });

  return items;
}

export async function ensureOrdersDataComplete({ force = false } = {}) {
  if (typeof window === "undefined") return;

  if (!force && isComplete()) return;

  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    try {
      const presentTypes = getPresentTypes();

      const missingSources = SOURCES.filter(({ config }) => {
        // We also re-fetch base policy types if their derived expired type is missing
        if (!presentTypes.has(config.tableType)) return true;

        if (config.tableType === "annual" && !presentTypes.has("expired-annual")) return true;
        if (config.tableType === "temporary" && !presentTypes.has("expired-temporary")) return true;
        if (config.tableType === "impound" && !presentTypes.has("expired-impound")) return true;

        return false;
      });

      if (missingSources.length === 0) return;

      const extractedLists = await Promise.all(
        missingSources.map(({ url, config }) => fetchAndExtract(url, config)),
      );

      const extracted = extractedLists.flat();

      const policyBase = extracted.filter(
        (x) => x?.type === "annual" || x?.type === "temporary" || x?.type === "impound",
      );
      const derivedExpired = deriveExpiredPolicies(policyBase);

      mergeOrdersData([...extracted, ...derivedExpired], { preferExisting: true });
    } finally {
      ensurePromise = null;
    }
  })();

  return ensurePromise;
}
