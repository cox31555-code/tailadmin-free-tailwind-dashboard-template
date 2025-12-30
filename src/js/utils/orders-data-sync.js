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

const REQUIRED_BASE_TYPES = [
  "annual",
  "temporary",
  "impound",
  "quotes",
  "pendingClaims",
  "completedClaims",
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

function hasBaseTypes() {
  const types = getPresentTypes();
  return REQUIRED_BASE_TYPES.every((t) => types.has(t));
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

  if (ensurePromise) return ensurePromise;

  // If we already have the base types, we can skip fetch but still derive expired-*.
  const skipFetch = !force && hasBaseTypes();

  ensurePromise = (async () => {
    try {
      if (!skipFetch) {
        const presentTypes = getPresentTypes();
        const sourcesToFetch = force
          ? SOURCES
          : SOURCES.filter(({ config }) => !presentTypes.has(config.tableType));

        if (sourcesToFetch.length) {
          const extractedLists = await Promise.all(
            sourcesToFetch.map(({ url, config }) => fetchAndExtract(url, config)),
          );

          const extracted = extractedLists.flat();
          if (extracted.length) {
            mergeOrdersData(extracted, { preferExisting: true });
          }
        }
      }

      // Always attempt to derive expired policies from whatever active policies exist.
      const currentOrders = readOrdersData();
      const activePolicies = currentOrders.filter(
        (x) => x?.type === "annual" || x?.type === "temporary" || x?.type === "impound",
      );
      const derivedExpired = deriveExpiredPolicies(activePolicies);
      if (derivedExpired.length) {
        mergeOrdersData(derivedExpired, { preferExisting: true });
      }
    } finally {
      ensurePromise = null;
    }
  })();

  return ensurePromise;
}
