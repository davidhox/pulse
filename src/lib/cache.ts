import { CachedFeed } from "./types";
import * as fs from "fs";
import * as path from "path";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_DIR = "/tmp/pulse-cache";

const memoryCache = new Map<string, CachedFeed>();

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cacheFilePath(sourceId: string): string {
  return path.join(CACHE_DIR, `${sourceId}.json`);
}

export function getCached(sourceId: string): CachedFeed | null {
  // Try memory first
  const mem = memoryCache.get(sourceId);
  if (mem && Date.now() - mem.fetchedAt < CACHE_TTL) {
    return mem;
  }

  // Try filesystem
  try {
    const filePath = cacheFilePath(sourceId);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as CachedFeed;
      memoryCache.set(sourceId, data);
      if (Date.now() - data.fetchedAt < CACHE_TTL) {
        return data;
      }
      // Stale but usable
      return data;
    }
  } catch {
    // Filesystem cache miss
  }

  return null;
}

export function getStale(sourceId: string): CachedFeed | null {
  const mem = memoryCache.get(sourceId);
  if (mem) return mem;

  try {
    const filePath = cacheFilePath(sourceId);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8")) as CachedFeed;
    }
  } catch {
    // noop
  }

  return null;
}

export function isFresh(sourceId: string): boolean {
  const cached = getCached(sourceId);
  return cached !== null && Date.now() - cached.fetchedAt < CACHE_TTL;
}

export function setCache(sourceId: string, feed: CachedFeed) {
  memoryCache.set(sourceId, feed);

  try {
    ensureCacheDir();
    fs.writeFileSync(cacheFilePath(sourceId), JSON.stringify(feed));
  } catch {
    // Filesystem write failed, memory cache still works
  }
}

export function bustCache(sourceId?: string) {
  if (sourceId) {
    memoryCache.delete(sourceId);
    try {
      fs.unlinkSync(cacheFilePath(sourceId));
    } catch {
      // noop
    }
  } else {
    memoryCache.clear();
    try {
      ensureCacheDir();
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      }
    } catch {
      // noop
    }
  }
}
