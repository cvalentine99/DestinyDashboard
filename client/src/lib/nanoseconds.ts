/**
 * Nanosecond Precision Timestamp Utilities
 * 
 * For forensic-grade timeline analysis, we need nanosecond precision
 * to accurately sequence packets and correlate events.
 * 
 * 1 second = 1,000,000,000 nanoseconds
 * JavaScript Date only supports millisecond precision, so we use BigInt
 * for storage and custom formatting for display.
 */

// Get current time in nanoseconds (using performance.now() for sub-ms precision)
export function nowNanoseconds(): bigint {
  const ms = Date.now();
  // Add sub-millisecond precision from performance.now()
  const perfNow = performance.now();
  const subMs = perfNow - Math.floor(perfNow);
  const ns = BigInt(ms) * BigInt(1_000_000) + BigInt(Math.floor(subMs * 1_000_000));
  return ns;
}

// Convert milliseconds to nanoseconds
export function msToNs(ms: number): bigint {
  return BigInt(Math.floor(ms * 1_000_000));
}

// Convert nanoseconds to milliseconds
export function nsToMs(ns: bigint): number {
  return Number(ns / BigInt(1_000_000));
}

// Convert nanoseconds to Date object (loses sub-ms precision)
export function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / BigInt(1_000_000)));
}

// Convert Date to nanoseconds
export function dateToNs(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

// Format nanoseconds as human-readable timestamp with full precision
export function formatNanoseconds(ns: bigint, options?: {
  includeDate?: boolean;
  includeNanos?: boolean;
  compact?: boolean;
}): string {
  const { includeDate = false, includeNanos = true, compact = false } = options || {};
  
  const totalMs = Number(ns / BigInt(1_000_000));
  const nanoRemainder = Number(ns % BigInt(1_000_000));
  
  const date = new Date(totalMs);
  
  // Extract time components
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
  
  // Format nanoseconds (remaining after milliseconds)
  const micros = Math.floor(nanoRemainder / 1000).toString().padStart(3, '0');
  const nanos = (nanoRemainder % 1000).toString().padStart(3, '0');
  
  let result = '';
  
  if (includeDate) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    result += `${year}-${month}-${day} `;
  }
  
  if (compact) {
    result += `${hours}:${minutes}:${seconds}`;
    if (includeNanos) {
      result += `.${milliseconds}${micros}${nanos}`;
    }
  } else {
    result += `${hours}:${minutes}:${seconds}.${milliseconds}`;
    if (includeNanos) {
      result += ` ${micros}μs ${nanos}ns`;
    }
  }
  
  return result;
}

// Format nanosecond duration (delta between two timestamps)
export function formatNsDuration(startNs: bigint, endNs: bigint): string {
  const deltaNs = endNs - startNs;
  
  if (deltaNs < BigInt(1_000)) {
    return `${deltaNs}ns`;
  } else if (deltaNs < BigInt(1_000_000)) {
    const micros = Number(deltaNs) / 1000;
    return `${micros.toFixed(2)}μs`;
  } else if (deltaNs < BigInt(1_000_000_000)) {
    const ms = Number(deltaNs) / 1_000_000;
    return `${ms.toFixed(3)}ms`;
  } else {
    const seconds = Number(deltaNs) / 1_000_000_000;
    return `${seconds.toFixed(3)}s`;
  }
}

// Calculate time delta in nanoseconds
export function nsDelta(startNs: bigint, endNs: bigint): bigint {
  return endNs - startNs;
}

// Format relative time from nanoseconds (e.g., "2.5ms ago")
export function formatRelativeNs(ns: bigint, referenceNs?: bigint): string {
  const ref = referenceNs || nowNanoseconds();
  const delta = ref - ns;
  
  if (delta < BigInt(0)) {
    return 'in the future';
  }
  
  const deltaMs = Number(delta / BigInt(1_000_000));
  
  if (deltaMs < 1) {
    return `${Number(delta / BigInt(1_000))}μs ago`;
  } else if (deltaMs < 1000) {
    return `${deltaMs.toFixed(1)}ms ago`;
  } else if (deltaMs < 60000) {
    return `${(deltaMs / 1000).toFixed(1)}s ago`;
  } else if (deltaMs < 3600000) {
    return `${Math.floor(deltaMs / 60000)}m ago`;
  } else {
    return `${Math.floor(deltaMs / 3600000)}h ago`;
  }
}

// Parse a nanosecond timestamp from string or number
export function parseNs(value: string | number | bigint): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  return BigInt(value);
}

// Sort array by nanosecond timestamp field
export function sortByNs<T extends { timestampNs: bigint | string | number }>(
  items: T[],
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aNs = parseNs(a.timestampNs);
    const bNs = parseNs(b.timestampNs);
    const diff = aNs - bNs;
    if (order === 'desc') {
      return diff > BigInt(0) ? -1 : diff < BigInt(0) ? 1 : 0;
    }
    return diff > BigInt(0) ? 1 : diff < BigInt(0) ? -1 : 0;
  });
}

// Group events by time window (in nanoseconds)
export function groupByTimeWindow<T extends { timestampNs: bigint | string | number }>(
  items: T[],
  windowNs: bigint
): Map<bigint, T[]> {
  const groups = new Map<bigint, T[]>();
  
  for (const item of items) {
    const ns = parseNs(item.timestampNs);
    const windowStart = (ns / windowNs) * windowNs;
    
    if (!groups.has(windowStart)) {
      groups.set(windowStart, []);
    }
    groups.get(windowStart)!.push(item);
  }
  
  return groups;
}

// Constants for common time conversions
export const NS_PER_MICROSECOND = BigInt(1_000);
export const NS_PER_MILLISECOND = BigInt(1_000_000);
export const NS_PER_SECOND = BigInt(1_000_000_000);
export const NS_PER_MINUTE = BigInt(60_000_000_000);
export const NS_PER_HOUR = BigInt(3_600_000_000_000);
