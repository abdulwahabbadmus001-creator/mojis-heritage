/**
 * Scheduled External Nigerian Cultural Heritage Sync Script
 *
 * Queries live external open-access museum & knowledge APIs:
 *   1. The Metropolitan Museum of Art Open Access API (/public/collection/v1/objects/{id})
 *   2. Wikipedia MediaWiki Action API (Nigerian heritage & archaeological articles)
 *   3. Wikimedia Commons API (Open-licensed Nigerian heritage media files -> Pending Review)
 *
 * Validates Nigerian cultural relevance and open licences, deduplicates by fingerprint,
 * and writes `public/external-discoveries-snapshot.json` so automated background runs
 * (e.g., via GitHub Actions cron) keep the archive updated without requiring anyone
 * to open the browser or click an admin button.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  VERIFIED_BASELINE_EXTERNAL_RECORDS,
  deduplicateDiscoveryRecords,
  fetchFromWikipediaNigeriaAPI,
  fetchFromMetMuseumNigeriaAPI,
  fetchFromWikimediaCommonsNigeriaAPI,
} from "../src/services/externalDiscovery.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.resolve(
  __dirname,
  "../public/external-discoveries-snapshot.json"
);

async function runScheduledSync() {
  const startedAt = new Date().toISOString();
  const providerStatuses = {};
  const errors = [];
  const liveFetched = [];

  const tasks = [
    {
      id: "met_museum",
      name: "The Metropolitan Museum of Art Open Access API",
      fn: fetchFromMetMuseumNigeriaAPI,
    },
    {
      id: "wikipedia_nigeria",
      name: "Wikipedia & Wikidata Nigerian Heritage Archive",
      fn: fetchFromWikipediaNigeriaAPI,
    },
    {
      id: "wikimedia_commons",
      name: "Wikimedia Commons Nigerian Heritage Media",
      fn: fetchFromWikimediaCommonsNigeriaAPI,
    },
  ];

  for (const task of tasks) {
    try {
      const items = await task.fn();
      liveFetched.push(...items);
      providerStatuses[task.id] = {
        status: "healthy",
        lastSyncAt: new Date().toISOString(),
        fetchedCount: items.length,
        publishedCount: items.filter(
          (r) => r.status === "Published" && r.isApprovedForPublic === true
        ).length,
        pendingReviewCount: items.filter((r) => r.status === "Pending Review")
          .length,
        error: null,
      };
      console.log(
        `[SYNC OK] ${task.id}: fetched ${items.length} Nigerian heritage records.`
      );
    } catch (error) {
      const message = error?.message || String(error);
      errors.push({
        providerId: task.id,
        providerName: task.name,
        message,
        timestamp: new Date().toISOString(),
      });
      providerStatuses[task.id] = {
        status: "degraded",
        lastSyncAt: new Date().toISOString(),
        fetchedCount: 0,
        error: message,
      };
      console.warn(`[SYNC WARN] ${task.id}: ${message}`);
    }
  }

  let existingSnapshotRecords = [];
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.records)) {
      existingSnapshotRecords = parsed.records;
    }
  } catch {
    existingSnapshotRecords = [];
  }

  const combined = deduplicateDiscoveryRecords([
    ...liveFetched,
    ...existingSnapshotRecords,
    ...VERIFIED_BASELINE_EXTERNAL_RECORDS,
  ]);

  const snapshotPayload = {
    schemaVersion: "1.0",
    projectId: "mojis-heritage-ae06c",
    lastScheduledSyncAt: startedAt,
    totalRecords: combined.length,
    publishedCount: combined.filter(
      (r) => r.status === "Published" && r.isApprovedForPublic === true
    ).length,
    pendingReviewCount: combined.filter((r) => r.status === "Pending Review")
      .length,
    providerStatuses,
    errors,
    records: combined,
  };

  await fs.writeFile(
    SNAPSHOT_PATH,
    `${JSON.stringify(snapshotPayload, null, 2)}\n`,
    "utf8"
  );

  console.log(
    `[SYNC COMPLETE] Wrote ${combined.length} deduplicated Nigerian heritage records (${snapshotPayload.publishedCount} Published, ${snapshotPayload.pendingReviewCount} Pending Review) to ${SNAPSHOT_PATH}`
  );
}

runScheduledSync().catch((err) => {
  console.error("[SYNC FATAL]", err);
  process.exitCode = 1;
});
