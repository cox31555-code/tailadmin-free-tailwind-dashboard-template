const ORDERS_DATA_KEY = "ordersData";
const ORDERS_DATA_VERSION_KEY = "ordersData_version";
const ORDERS_DATA_UPDATED_EVENT = "ordersData:updated";

function safeJsonParse(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getOrdersDataVersion() {
  if (typeof window === "undefined") return "0";
  return localStorage.getItem(ORDERS_DATA_VERSION_KEY) || "0";
}

export function bumpOrdersDataVersion() {
  if (typeof window === "undefined") return "0";

  const current = parseInt(localStorage.getItem(ORDERS_DATA_VERSION_KEY) || "0", 10);
  const next = Number.isFinite(current) ? current + 1 : 1;
  localStorage.setItem(ORDERS_DATA_VERSION_KEY, String(next));
  return String(next);
}

export function readOrdersData() {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(ORDERS_DATA_KEY);
  const parsed = safeJsonParse(raw, []);

  if (!Array.isArray(parsed)) return [];

  // Lightweight migrations / normalizations to keep filters consistent.
  // Older dashboard code used `type: 'quote'` but table configs use `quotes`.
  return parsed.map((record) => {
    if (!record || typeof record !== "object") return record;

    if (record.type === "quote") {
      return { ...record, type: "quotes" };
    }

    return record;
  });
}

function dispatchOrdersDataUpdated(version) {
  try {
    window.dispatchEvent(
      new CustomEvent(ORDERS_DATA_UPDATED_EVENT, {
        detail: { version: version ?? getOrdersDataVersion() },
      }),
    );
  } catch {
    // no-op
  }
}

export function writeOrdersData(nextOrders) {
  if (typeof window === "undefined") return;

  const safeNext = Array.isArray(nextOrders) ? nextOrders : [];

  const currentRaw = localStorage.getItem(ORDERS_DATA_KEY) || "";
  const nextRaw = JSON.stringify(safeNext);

  // Avoid thrashing version + charts if data didn't change.
  if (currentRaw === nextRaw) {
    return;
  }

  localStorage.setItem(ORDERS_DATA_KEY, nextRaw);
  const nextVersion = bumpOrdersDataVersion();
  dispatchOrdersDataUpdated(nextVersion);
}

function normalizeString(value) {
  return (value || "").toString().trim().toLowerCase();
}

function buildRecordKey(record) {
  const type = record?.type || "unknown";

  if (type === "annual" || type === "temporary" || type === "impound" || type === "expired-annual" || type === "expired-temporary" || type === "expired-impound") {
    return [
      type,
      normalizeString(record.email),
      normalizeString(record.vehicle),
      normalizeString(record.policyStart || record.date),
      normalizeString(record.policyEnd),
    ].join(":");
  }

  if (type === "quotes") {
    return [
      "quotes",
      normalizeString(record.email),
      normalizeString(record.vehicle),
      normalizeString(record.date),
      normalizeString(record.time),
      normalizeString(record.amount),
    ].join(":");
  }

  if (type === "pendingClaims") {
    return [
      "pendingClaims",
      normalizeString(record.email),
      normalizeString(record.incidentDate),
      normalizeString(record.claimType),
    ].join(":");
  }

  if (type === "completedClaims") {
    return [
      "completedClaims",
      normalizeString(record.email),
      normalizeString(record.incidentDate),
      normalizeString(record.completionDate),
      normalizeString(record.claimType),
    ].join(":");
  }

  // Fallback: best-effort stable key
  return [type, normalizeString(record.email), normalizeString(record.date)].join(":");
}

/**
 * Merge records into ordersData.
 *
 * Default behavior keeps existing entries (user-edited) and only adds missing.
 */
export function mergeOrdersData(newItems, { preferExisting = true } = {}) {
  if (typeof window === "undefined") return;

  const incoming = Array.isArray(newItems) ? newItems.filter(Boolean) : [];
  if (incoming.length === 0) return;

  const existing = readOrdersData();

  const byKey = new Map();
  existing.forEach((item) => {
    byKey.set(buildRecordKey(item), item);
  });

  incoming.forEach((item) => {
    const key = buildRecordKey(item);
    if (!byKey.has(key)) {
      byKey.set(key, item);
      return;
    }

    if (!preferExisting) {
      byKey.set(key, item);
    }
  });

  // Preserve existing ordering as much as possible
  const merged = [];
  const seen = new Set();

  existing.forEach((item) => {
    const key = buildRecordKey(item);
    const resolved = byKey.get(key);
    if (resolved && !seen.has(key)) {
      merged.push(resolved);
      seen.add(key);
    }
  });

  incoming.forEach((item) => {
    const key = buildRecordKey(item);
    const resolved = byKey.get(key);
    if (resolved && !seen.has(key)) {
      merged.push(resolved);
      seen.add(key);
    }
  });

  writeOrdersData(merged);
}

export function onOrdersDataUpdated(handler, { includeStorage = true } = {}) {
  if (typeof window === "undefined") return () => {};

  const safeHandler = typeof handler === "function" ? handler : () => {};

  const onCustom = (event) => {
    safeHandler({
      version: event?.detail?.version || getOrdersDataVersion(),
      source: "custom",
    });
  };

  window.addEventListener(ORDERS_DATA_UPDATED_EVENT, onCustom);

  let onStorage = null;
  if (includeStorage) {
    onStorage = (event) => {
      if (!event || event.key !== ORDERS_DATA_KEY) return;
      safeHandler({ version: getOrdersDataVersion(), source: "storage" });
    };
    window.addEventListener("storage", onStorage);
  }

  return () => {
    window.removeEventListener(ORDERS_DATA_UPDATED_EVENT, onCustom);
    if (onStorage) window.removeEventListener("storage", onStorage);
  };
}

export const __ordersDataInternals = {
  ORDERS_DATA_KEY,
  ORDERS_DATA_VERSION_KEY,
  ORDERS_DATA_UPDATED_EVENT,
};
