import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  cultures,
  getCultureBySlug,
  getCultureByName,
  NIGERIAN_STATES_AND_FCT,
  HISTORICAL_PERIODS,
  ARTIFACT_CLASSIFICATIONS,
} from "../src/data/cultures.js";
import {
  enrichRecordWithKnowledgeGraph,
  getKnowledgeGraphConnections,
} from "../src/data/knowledgeGraph.js";
import { seedPosts, listings as seedListings } from "../src/data/seed.js";
import {
  validatePublicSubmission,
  validateAttachmentFileMeta,
  createPublicSubmission,
  getAllSubmissionsForAdmin,
  getPublishedCommunitySubmissions,
  approveSubmission,
  publishSubmission,
  transitionSubmissionStatus,
  submitCorrectionOrWithdrawalRequest,
  getAdminAuditLogs,
  isSubmissionPubliclyVisible,
} from "../src/services/contributions.js";
import {
  evaluateNigerianRelevance,
  normalizeExternalRecord,
  deduplicateDiscoveryRecords,
  computeDiscoveryFingerprint,
  isLicenceOpenAndPermissible,
  VERIFIED_BASELINE_EXTERNAL_RECORDS,
  VERIFIED_MET_NIGERIA_OBJECT_IDS,
  mapExternalDiscoveryToPost,
  getProviderConfigs,
  setProviderEnabled,
} from "../src/services/externalDiscovery.js";
import { filterPubliclyVisiblePosts } from "../src/services/content.js";
import { mergeWithPreservedSnapshot } from "../scripts/sync-external-heritage.mjs";
import {
  ADMIN_ROUTE_SEGMENT,
  ADMIN_BASE_PATH,
  adminPath,
  LEGACY_BLOCKED_ADMIN_PATHS,
} from "../src/config/routes.js";
import { isSafeHttpUrl, sanitizeHttpUrl } from "../src/utils/urlSafety.js";

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

test("1. Nigerian Cultural Knowledge Graph covers all 14 core communities and 36 states + FCT", () => {
  const expectedCommunities = [
    "yoruba",
    "igbo",
    "hausa",
    "edo",
    "ijaw",
    "fulani",
    "tiv",
    "kanuri",
    "ibibio",
    "efik",
    "nupe",
    "urhobo",
    "itsekiri",
    "gbagyi",
  ];
  for (const slug of expectedCommunities) {
    const found = getCultureBySlug(slug);
    assert.ok(found, `Expected Nigerian community "${slug}" to exist in cultures.js`);
    assert.ok(Array.isArray(found.states) && found.states.length > 0);
    assert.ok(Array.isArray(found.kingdomsAndInstitutions) && found.kingdomsAndInstitutions.length > 0);
    assert.ok(Array.isArray(found.notableTraditions) && found.notableTraditions.length > 0);
  }
  assert.equal(NIGERIAN_STATES_AND_FCT.length, 37);
  assert.ok(HISTORICAL_PERIODS.includes("Unknown"));
  assert.ok(HISTORICAL_PERIODS.includes("Approximate"));
  assert.ok(HISTORICAL_PERIODS.includes("Disputed"));
  assert.ok(ARTIFACT_CLASSIFICATIONS.length >= 8);
});

test("2. Public submission validation enforces required fields, consent flags, and file safety", () => {
  const invalid = validatePublicSubmission({
    title: "Hi",
    contentType: "invalid",
    body: "Too short",
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 5);

  const validUnknownDate = validatePublicSubmission({
    title: "Igun Street Lost-Wax Crucible Technique",
    contentType: "artifact",
    body: "Detailed documentation of the clay and beeswax core preparation used by hereditary brass-casters in Benin City, Edo State.",
    state: "Edo",
    ethnicGroup: "Edo",
    historicalPeriod: "Unknown",
    sourcesAndReferences: "Field interview with Igun Eronmwon guild elders (2025); NCMM Benin Museum archive.",
    contributorName: "Dr. Osahon Egharevba",
    attributionPreference: "Named Contributor",
    copyrightDeclaration: "CC BY-SA 4.0 Educational Attribution Permitted",
    consentToReview: true,
    consentToPublishIfApproved: true,
    rightsConfirmation: true,
  });
  assert.equal(validUnknownDate.valid, true);
  assert.equal(validUnknownDate.errors.length, 0);

  // Reject executable or oversized attachments
  const badExt = validateAttachmentFileMeta({
    name: "payload.exe",
    type: "image/png",
    size: 1024,
  });
  assert.equal(badExt.valid, false);

  const oversized = validateAttachmentFileMeta({
    name: "highres.jpg",
    type: "image/jpeg",
    size: 12 * 1024 * 1024,
  });
  assert.equal(oversized.valid, false);

  const validPdf = validateAttachmentFileMeta({
    name: "provenance-dossier.pdf",
    type: "application/pdf",
    size: 512 * 1024,
  });
  assert.equal(validPdf.valid, true);
});

test("3. Strict submission privacy & distinct Approve vs. Publish workflow", async () => {
  const storage = createMemoryStorage();
  const payload = {
    title: "Nsibidi Ideographic Cloth from Old Calabar",
    contentType: "artifact",
    body: "An indigo-dyed Ukara ritual cloth inscribed with Nsibidi geometric motifs associated with the Ekpe society in Cross River State.",
    state: "Cross River",
    locality: "Calabar",
    ethnicGroup: "Efik",
    historicalPeriod: "Approximate",
    sourcesAndReferences: "Old Residency Museum Calabar (NCMM) catalogue.",
    contributorName: "Bassey Henshaw",
    attributionPreference: "Named Contributor",
    copyrightDeclaration: "CC BY-SA 4.0 Educational Attribution Permitted",
    consentToReview: true,
    consentToPublishIfApproved: true,
    rightsConfirmation: true,
  };

  // Step A: Public submission enters Pending Review and is NEVER publicly visible
  const created = await createPublicSubmission(payload, {
    storage,
    skipFirestore: true,
  });
  assert.equal(created.status, "Pending Review");
  assert.equal(created.isApproved, false);
  assert.equal(created.isPublished, false);
  assert.match(created.referenceCode, /^MH-SUB-\d{4}-[A-Z0-9]+$/);
  assert.equal(isSubmissionPubliclyVisible(created), false);

  const publicBeforeApproval = await getPublishedCommunitySubmissions({
    storage,
    skipFirestore: true,
  });
  assert.equal(publicBeforeApproval.length, 0);

  // Step B: Attempting to publish before approval must fail
  await assert.rejects(
    () =>
      publishSubmission(created.id, {
        adminEmail: "curator@mojisheritage.ng",
        storage,
        skipFirestore: true,
      }),
    /must be in "Approved" status before publication/
  );

  // Step C: Admin Approves submission (without publishing yet) -> still excluded from public feed
  const approved = await approveSubmission(created.id, {
    adminEmail: "curator@mojisheritage.ng",
    reviewerNotes: "Verified against Old Residency Museum Calabar records.",
    storage,
    skipFirestore: true,
  });
  assert.equal(approved.status, "Approved");
  assert.equal(approved.isApproved, true);
  assert.equal(approved.isPublished, false);
  assert.equal(isSubmissionPubliclyVisible(approved), false);

  const publicAfterApproveOnly = await getPublishedCommunitySubmissions({
    storage,
    skipFirestore: true,
  });
  assert.equal(publicAfterApproveOnly.length, 0);

  // Step D: Admin explicitly Publishes the approved submission -> now visible in public feed
  let publishedPostCapture = null;
  const { submission: publishedSub, publishedPost } = await publishSubmission(
    created.id,
    {
      adminEmail: "curator@mojisheritage.ng",
      reviewerNotes: "Published to Cultural Heritage collection.",
      publishPostCallback: async (postDoc) => {
        publishedPostCapture = postDoc;
      },
      storage,
      skipFirestore: true,
    }
  );
  assert.equal(publishedSub.status, "Published");
  assert.equal(publishedSub.isApproved, true);
  assert.equal(publishedSub.isPublished, true);
  assert.ok(publishedPostCapture);
  assert.equal(
    publishedPost.sourceLabel,
    "Community-Contributed · Admin Approved"
  );

  const publicAfterPublish = await getPublishedCommunitySubmissions({
    storage,
    skipFirestore: true,
  });
  assert.equal(publicAfterPublish.length, 1);

  // Step E: Transitioning to Rejected or Withdrawn immediately removes from public visibility
  const withdrawn = await transitionSubmissionStatus(
    created.id,
    "Withdrawn",
    {
      adminEmail: "curator@mojisheritage.ng",
      reviewerNotes: "Withdrawn at contributor's request.",
      storage,
      skipFirestore: true,
    }
  );
  assert.equal(withdrawn.isPublished, false);
  const publicAfterWithdraw = await getPublishedCommunitySubmissions({
    storage,
    skipFirestore: true,
  });
  assert.equal(publicAfterWithdraw.length, 0);

  // Verify immutable audit log recorded all admin transitions
  const logs = await getAdminAuditLogs(storage);
  assert.ok(logs.length >= 3);
  assert.ok(logs.some((l) => l.action === "APPROVE_SUBMISSION"));
  assert.ok(logs.some((l) => l.action === "PUBLISH_SUBMISSION"));
});

test("4. Duplicate submission detection and contributor correction/withdrawal requests", async () => {
  const storage = createMemoryStorage();
  const sample = {
    title: "Masaga Glass Beadwork of Bida Emirate",
    contentType: "artifact",
    body: "Traditional molten glass bead and bangle crafting by the Masaga guild in Bida, Niger State, associated with Nupe heritage.",
    state: "Niger",
    ethnicGroup: "Nupe",
    historicalPeriod: "Disputed",
    sourcesAndReferences: "Bida Masaga Guild oral archive.",
    contributorName: "Nda Aliyu",
    attributionPreference: "Named Contributor",
    copyrightDeclaration: "CC0 1.0 Public Domain Dedication",
    consentToReview: true,
    consentToPublishIfApproved: true,
    rightsConfirmation: true,
  };

  const first = await createPublicSubmission(sample, {
    storage,
    skipFirestore: true,
  });
  await assert.rejects(
    () =>
      createPublicSubmission(sample, {
        storage,
        skipFirestore: true,
      }),
    /already on file/
  );

  const corr = await submitCorrectionOrWithdrawalRequest(
    {
      referenceOrRecordId: first.referenceCode,
      requestType: "Additional Source Citation",
      requesterName: "Nda Aliyu",
      details: "Adding NCMM Minna archival catalogue citation for Masaga glass furnaces.",
    },
    { storage, skipFirestore: true }
  );
  assert.equal(corr.status, "Pending Review");
  assert.match(corr.referenceCode, /^MH-REQ-\d{4}-/);
});

test("5. Nigerian relevance filtering strictly accepts Nigerian heritage and rejects non-Nigerian items", () => {
  const beninPlaque = evaluateNigerianRelevance({
    title: "Brass Plaque: Oba and Attendants",
    country: "Nigeria",
    culture: "Edo peoples, Court of Benin",
    summary: "Cast in Benin City, Edo State.",
  });
  assert.equal(beninPlaque.isNigerianRelevant, true);
  assert.ok(beninPlaque.score >= 6);

  const nokHead = evaluateNigerianRelevance({
    title: "Nok Terracotta Figure from Kaduna",
    summary: "Excavated in southern Kaduna State, Central Nigeria.",
  });
  assert.equal(nokHead.isNigerianRelevant, true);

  // Reject non-Nigerian African or global artifacts with no Nigerian connection
  const ashantiStool = evaluateNigerianRelevance({
    title: "Royal Asante Stool",
    country: "Ghana",
    culture: "Ashanti peoples, Kumasi",
    summary: "Carved wooden ceremonial stool from the Ashanti Kingdom in Ghana.",
  });
  assert.equal(ashantiStool.isNigerianRelevant, false);

  const frenchPainting = evaluateNigerianRelevance({
    title: "Landscape at Giverny",
    country: "France",
    culture: "French",
    summary: "19th century oil on canvas painting from Normandy, France.",
  });
  assert.equal(frenchPainting.isNigerianRelevant, false);
});

test("6. External API normalisation preserves attribution/licences and deduplicates records", () => {
  const normalizedMet = normalizeExternalRecord(
    {
      externalId: "310750",
      title: "Queen Mother Pendant Mask: Iyoba",
      country: "Nigeria",
      culture: "Court of Benin, Edo peoples",
      summary: "16th century ivory mask from Benin City, Nigeria.",
      sourceUrl: "https://www.metmuseum.org/art/collection/search/310750",
      accessionNumber: "1978.412.323",
      isPublicDomain: true,
    },
    "met_museum"
  );
  assert.equal(normalizedMet.trustLevel, "trusted_public");
  assert.equal(normalizedMet.isApprovedForPublic, true);
  assert.equal(normalizedMet.ethnicGroup, "Edo");
  assert.equal(normalizedMet.accessionNumber, "1978.412.323");

  // Non-free / restricted licence is blocked from public display
  const restrictedItem = normalizeExternalRecord(
    {
      externalId: "restricted-99",
      title: "Benin Palace Photograph",
      country: "Nigeria",
      summary: "Archival photograph of Benin City.",
      sourceUrl: "https://example.org/photo",
      licence: "All Rights Reserved - Copyrighted",
    },
    "wikimedia_commons"
  );
  assert.equal(isLicenceOpenAndPermissible(restrictedItem.licence), false);
  assert.equal(restrictedItem.trustLevel, "rights_restricted");
  assert.equal(restrictedItem.isApprovedForPublic, false);

  // Deduplication removes identical fingerprints or titles
  const deduped = deduplicateDiscoveryRecords([
    normalizedMet,
    { ...normalizedMet, id: "duplicate-copy" },
  ]);
  assert.equal(deduped.length, 1);
  assert.ok(computeDiscoveryFingerprint(normalizedMet).includes("310750"));

  // Provider toggle persistence
  const storage = createMemoryStorage();
  setProviderEnabled("wikimedia_commons", false, storage);
  const configs = getProviderConfigs(storage);
  const commonsCfg = configs.find((p) => p.id === "wikimedia_commons");
  assert.equal(commonsCfg.enabled, false);
});

test("7. Public feed filtering and Knowledge Graph connections work accurately", () => {
  const mixedRecords = [
    ...seedPosts,
    {
      id: "pending-test",
      title: "Unapproved Draft",
      status: "Pending Review",
      isPublished: false,
    },
    {
      id: "rejected-test",
      title: "Rejected Item",
      status: "Rejected",
      isPublished: false,
    },
  ];
  const visible = filterPubliclyVisiblePosts(mixedRecords);
  assert.equal(
    visible.some((r) => r.id === "pending-test" || r.id === "rejected-test"),
    false
  );
  assert.ok(visible.length >= seedPosts.length);

  const beninEnriched = enrichRecordWithKnowledgeGraph(
    seedPosts.find((p) => p.id === "benin")
  );
  assert.equal(beninEnriched.state, "Edo");
  assert.ok(beninEnriched.provenanceEvents.length >= 2);
  assert.ok(beninEnriched.annotations.length >= 2);

  const connections = getKnowledgeGraphConnections(
    beninEnriched,
    seedPosts,
    seedListings
  );
  assert.equal(connections.culture?.slug, "edo");
  assert.ok(connections.relatedDestinations.some((d) => d.id === "benin-palace"));
});

test("8. Security rules, FOUC theme script, and SEO files are properly hardened", () => {
  const rootDir = process.cwd();
  const firestoreRules = fs.readFileSync(
    path.join(rootDir, "firestore.rules"),
    "utf8"
  );
  const storageRules = fs.readFileSync(
    path.join(rootDir, "storage.rules"),
    "utf8"
  );
  const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  const robotsTxt = fs.readFileSync(
    path.join(rootDir, "public", "robots.txt"),
    "utf8"
  );

  // Verify Firestore rules enforce admin() for reading submissions, correctionRequests, and auditLogs
  assert.match(firestoreRules, /match \/submissions\/\{id\}/);
  assert.match(firestoreRules, /allow read: if admin\(\);/);
  assert.match(firestoreRules, /match \/correctionRequests\/\{id\}/);
  assert.match(firestoreRules, /match \/externalDiscoveries\/\{id\}/);
  assert.match(firestoreRules, /match \/auditLogs\/\{id\}/);
  assert.match(firestoreRules, /request\.auth\.token\.admin == true/);

  // Verify Storage rules protect private submission uploads
  assert.match(storageRules, /match \/submissions_private\/\{allPaths=\*\*\}/);
  assert.match(storageRules, /allow read: if admin\(\);/);

  // Verify FOUC prevention script in index.html
  assert.match(indexHtml, /mojis_theme_preference/);
  assert.match(indexHtml, /setAttribute\("data-theme", "noir"\)/);

  // Verify robots.txt disallows /admin
  assert.match(robotsTxt, /Disallow: \/admin/);
});

test("9. Verified Met Museum Nigerian object IDs, scheduled sync artifacts, and standalone archival dossier mapping", () => {
  assert.equal(VERIFIED_MET_NIGERIA_OBJECT_IDS.length, 6);
  assert.deepEqual(VERIFIED_MET_NIGERIA_OBJECT_IDS, [
    316516, 316520, 316521, 316522, 316524, 316525,
  ]);

  // Verify primary-title-first cultural inference prevents secondary body mentions from misclassifying
  const nriNormalized = normalizeExternalRecord(
    {
      externalId: "wiki-14283861",
      title: "Kingdom of Nri",
      summary: "Medieval Igbo polity in Anambra State.",
      body: "The Kingdom of Nri in Igboland later interacted with the Benin and Igala kingdoms.",
      sourceUrl: "https://en.wikipedia.org/wiki/Kingdom_of_Nri",
      licence: "CC BY-SA 4.0",
    },
    "wikipedia_nigeria"
  );
  assert.equal(nriNormalized.ethnicGroup, "Igbo");
  assert.equal(nriNormalized.state, "Anambra");

  const nokNormalized = normalizeExternalRecord(
    {
      externalId: "wiki-1889558",
      title: "Nok culture",
      summary: "Early terracotta tradition in Kaduna State.",
      body: "Nok terracotta preceded later traditions in Ile Ife and Benin.",
      sourceUrl: "https://en.wikipedia.org/wiki/Nok_culture",
      licence: "CC BY-SA 4.0",
    },
    "wikipedia_nigeria"
  );
  assert.equal(nokNormalized.ethnicGroup, "Gbagyi");
  assert.equal(nokNormalized.state, "Kaduna");

  // Standalone archival post mapping allows external discoveries to render at /post/:id without a manually written article
  const mappedDossier = mapExternalDiscoveryToPost(
    VERIFIED_BASELINE_EXTERNAL_RECORDS[0]
  );
  assert.equal(mappedDossier.id, VERIFIED_BASELINE_EXTERNAL_RECORDS[0].id);
  assert.equal(mappedDossier.isPublished, true);
  assert.match(mappedDossier.sourceLabel, /^External Discovery · /);
  assert.match(mappedDossier.body, /Archival Provenance & Open-Access Attribution/);

  // Verify scheduled sync snapshot and background automation files exist
  const rootDir = process.cwd();
  const snapshotRaw = fs.readFileSync(
    path.join(rootDir, "public", "external-discoveries-snapshot.json"),
    "utf8"
  );
  const snapshot = JSON.parse(snapshotRaw);
  assert.equal(snapshot.projectId, "mojis-heritage-ae06c");
  assert.ok(Array.isArray(snapshot.records) && snapshot.records.length >= 15);
  assert.equal(snapshot.providerStatuses.met_museum.fetchedCount, 6);
  assert.ok(snapshot.providerStatuses.wikipedia_nigeria.fetchedCount >= 6);
  assert.equal(snapshot.providerStatuses.wikimedia_commons.fetchedCount, 5);

  // Verify partial API failure resilience and curator review preservation
  const priorModeratedCommons = {
    id: "ext-wikimedia_commons-commons-29327025",
    externalId: "commons-29327025",
    providerId: "wikimedia_commons",
    title: "Bronze ornamental staff head, 9th century, Igbo Ukwu",
    status: "Published",
    isApprovedForPublic: true,
    trustLevel: "curator_approved",
    reviewerNotes: "Verified against NCMM Lagos catalogue.",
    reviewedBy: "curator@mojisheritage.ng",
  };
  const freshCommonsUnreviewed = {
    id: "ext-wikimedia_commons-commons-29327025",
    externalId: "commons-29327025",
    providerId: "wikimedia_commons",
    title: "Bronze ornamental staff head, 9th century, Igbo Ukwu",
    status: "Pending Review",
    isApprovedForPublic: false,
    trustLevel: "needs_review",
  };
  // Even if Met Museum fails (0 live items) and Commons returns fresh unreviewed item,
  // mergeWithPreservedSnapshot keeps prior Met records AND preserves curator's Published decision
  const mergedOnPartialOutage = mergeWithPreservedSnapshot(
    [freshCommonsUnreviewed],
    [priorModeratedCommons, ...snapshot.records],
    VERIFIED_BASELINE_EXTERNAL_RECORDS
  );
  const preservedCommons = mergedOnPartialOutage.find(
    (r) => r.externalId === "commons-29327025"
  );
  assert.equal(preservedCommons.status, "Published");
  assert.equal(preservedCommons.isApprovedForPublic, true);
  assert.equal(preservedCommons.reviewerNotes, "Verified against NCMM Lagos catalogue.");
  assert.ok(
    mergedOnPartialOutage.some((r) => r.providerId === "met_museum"),
    "Previously verified Met Museum records must be preserved when Met API fails"
  );

  const functionsIndex = fs.readFileSync(
    path.join(rootDir, "functions", "index.js"),
    "utf8"
  );
  assert.match(functionsIndex, /exports\.scheduledHeritageDiscoverySync = onSchedule/);

  const workflowYaml = fs.readFileSync(
    path.join(rootDir, ".github", "workflows", "scheduled-heritage-sync.yml"),
    "utf8"
  );
  assert.match(workflowYaml, /cron: "0 4 \* \* \*"/);
  assert.match(workflowYaml, /FirebaseExtended\/action-hosting-deploy@v0/);
});

test("10. Admin route hardening replaces predictable /admin path and prevents public route leakage", () => {
  assert.equal(ADMIN_BASE_PATH, "/mh-newsroom-7f4c9a2e8b1d");
  assert.ok(ADMIN_ROUTE_SEGMENT.length >= 16);
  assert.equal(adminPath(""), "/mh-newsroom-7f4c9a2e8b1d");
  assert.equal(adminPath("submissions"), "/mh-newsroom-7f4c9a2e8b1d/submissions");
  assert.equal(adminPath("/discovery/"), "/mh-newsroom-7f4c9a2e8b1d/discovery");
  assert.deepEqual(LEGACY_BLOCKED_ADMIN_PATHS, ["/admin", "/admin/*"]);

  const rootDir = process.cwd();
  const appJsx = fs.readFileSync(path.join(rootDir, "src", "App.jsx"), "utf8");
  const adminJsx = fs.readFileSync(
    path.join(rootDir, "src", "admin", "Admin.jsx"),
    "utf8"
  );
  const siteJsx = fs.readFileSync(
    path.join(rootDir, "src", "components", "Site.jsx"),
    "utf8"
  );
  const publicJsx = fs.readFileSync(
    path.join(rootDir, "src", "pages", "Public.jsx"),
    "utf8"
  );
  const robotsTxt = fs.readFileSync(
    path.join(rootDir, "public", "robots.txt"),
    "utf8"
  );
  const sitemapXml = fs.readFileSync(
    path.join(rootDir, "public", "sitemap.xml"),
    "utf8"
  );

  // Verify App.jsx mounts AdminGate at ADMIN_BASE_PATH and routes /admin & /admin/* to NotFound
  assert.match(appJsx, /path=\{ADMIN_BASE_PATH\}\s+element=\{<AdminGate \/>\}/);
  assert.match(appJsx, /path="\/admin"\s+element=\{<NotFound \/>\}/);
  assert.match(appJsx, /path="\/admin\/\*"\s+element=\{<NotFound \/>\}/);
  assert.doesNotMatch(appJsx, /path="\/admin"\s+element=\{<AdminGate \/>\}/);

  // Verify Admin.jsx uses ADMIN_BASE_PATH and adminPath(...) for all internal navigation
  assert.doesNotMatch(adminJsx, /to="\/admin/);
  assert.match(adminJsx, /to=\{ADMIN_BASE_PATH\}/);
  assert.match(adminJsx, /to=\{adminPath\("submissions"\)\}/);
  assert.match(adminJsx, /to=\{adminPath\("discovery"\)\}/);
  assert.match(adminJsx, /to=\{adminPath\("posts"\)\}/);
  assert.match(adminJsx, /to=\{adminPath\("visit"\)\}/);
  assert.match(adminJsx, /to=\{adminPath\("comments"\)\}/);
  assert.match(adminJsx, /to=\{adminPath\("settings"\)\}/);
  assert.match(adminJsx, /to=\{adminPath\("analytics"\)\}/);
  assert.match(adminJsx, /to=\{adminPath\("audit"\)\}/);

  // Verify public navigation, footer, public pages, robots.txt, and sitemap.xml never leak ADMIN_ROUTE_SEGMENT
  assert.equal(siteJsx.includes(ADMIN_ROUTE_SEGMENT), false);
  assert.equal(publicJsx.includes(ADMIN_ROUTE_SEGMENT), false);
  assert.equal(robotsTxt.includes(ADMIN_ROUTE_SEGMENT), false);
  assert.equal(sitemapXml.includes(ADMIN_ROUTE_SEGMENT), false);
});

test("11. Admin dashboard layout and scroll-reset eliminate section-click scrolling defects on desktop and mobile", () => {
  const rootDir = process.cwd();
  const adminJsx = fs.readFileSync(
    path.join(rootDir, "src", "admin", "Admin.jsx"),
    "utf8"
  );
  const indexCss = fs.readFileSync(
    path.join(rootDir, "src", "index.css"),
    "utf8"
  );

  // Verify AdminLayout resets window and main container scroll immediately on pathname change and section click
  assert.match(adminJsx, /function scrollAdminViewToTop/);
  assert.match(adminJsx, /scrollAdminViewToTop\(adminMainRef\.current\)/);
  assert.match(adminJsx, /onClick=\{handleSectionNavClick\}/);
  assert.match(adminJsx, /className="admin-sidebar-nav"/);

  // Verify desktop sticky sidebar + align-items: start and mobile compact horizontal navigation strip in index.css
  assert.match(indexCss, /grid-template-columns:\s*260px minmax\(0,\s*1fr\)/);
  assert.match(indexCss, /align-items:\s*start/);
  assert.match(indexCss, /\.admin-sidebar-nav\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(indexCss, /\.sidebar a\.admin-nav-link\.active/);
});

test("12. URL scheme sanitization, contribution rate limiting, HTTP security headers, and build hardening", async () => {
  // 1. URL scheme sanitization blocks XSS / dangerous schemes
  assert.equal(isSafeHttpUrl("https://www.metmuseum.org/art/collection/search/316524"), true);
  assert.equal(isSafeHttpUrl("http://en.wikipedia.org/wiki/Igbo-Ukwu"), true);
  assert.equal(isSafeHttpUrl("/mojis-mark.svg", { allowRelative: true }), true);
  assert.equal(isSafeHttpUrl("javascript:alert(1)"), false);
  assert.equal(isSafeHttpUrl("  JaVaScRiPt:alert(document.cookie)"), false);
  assert.equal(isSafeHttpUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="), false);
  assert.equal(isSafeHttpUrl("vbscript:msgbox(1)"), false);
  assert.equal(isSafeHttpUrl("//evil.example.com/payload.js", { allowRelative: true }), false);
  assert.equal(sanitizeHttpUrl("javascript:alert(1)", "#"), "#");

  // 2. Public contribution validation rejects dangerous mediaUrl schemes
  const xssSubmission = validatePublicSubmission({
    title: "Benin Royal Coral Bead Regalia",
    contentType: "artifact",
    body: "Ceremonial coral bead regalia worn at the royal court of the Oba of Benin in Edo State.",
    state: "Edo",
    ethnicGroup: "Edo",
    historicalPeriod: "Unknown",
    sourcesAndReferences: "NCMM Benin City Museum catalogue.",
    contributorName: "Curator Test",
    attributionPreference: "Named Contributor",
    mediaUrl: "javascript:alert('xss')",
    copyrightDeclaration: "CC0 1.0 Public Domain Dedication",
    consentToReview: true,
    consentToPublishIfApproved: true,
    rightsConfirmation: true,
  });
  assert.equal(xssSubmission.valid, false);
  assert.ok(
    xssSubmission.errors.some((e) => /Direct media URL must be a valid http/i.test(e))
  );
  assert.equal(xssSubmission.sanitized.mediaUrl, "");

  // 3. Contribution rate limiting prevents rapid spam bursts
  const rateStorage = createMemoryStorage();
  const basePayload = {
    contentType: "artifact",
    body: "Documented historical textile weaving tradition practiced by master weavers in Iseyin, Oyo State.",
    state: "Oyo",
    ethnicGroup: "Yoruba",
    historicalPeriod: "Approximate",
    sourcesAndReferences: "Iseyin Weavers Guild Archive (2025).",
    contributorName: "Adebayo Akanbi",
    attributionPreference: "Named Contributor",
    copyrightDeclaration: "CC BY-SA 4.0 Educational Attribution Permitted",
    consentToReview: true,
    consentToPublishIfApproved: true,
    rightsConfirmation: true,
  };
  await createPublicSubmission(
    { ...basePayload, title: "Aso-Oke Loom Pattern 1" },
    { storage: rateStorage, skipFirestore: true, maxPerWindow: 2 }
  );
  await createPublicSubmission(
    { ...basePayload, title: "Aso-Oke Loom Pattern 2" },
    { storage: rateStorage, skipFirestore: true, maxPerWindow: 2 }
  );
  await assert.rejects(
    () =>
      createPublicSubmission(
        { ...basePayload, title: "Aso-Oke Loom Pattern 3" },
        { storage: rateStorage, skipFirestore: true, maxPerWindow: 2 }
      ),
    /Rate limit exceeded/
  );

  // 4. Verify HTTP security headers in firebase.json and sourcemap hardening in vite.config.js
  const rootDir = process.cwd();
  const firebaseConfig = JSON.parse(
    fs.readFileSync(path.join(rootDir, "firebase.json"), "utf8")
  );
  const headerRules = firebaseConfig.hosting?.headers?.[0]?.headers || [];
  const headerMap = new Map(headerRules.map((h) => [h.key, h.value]));

  assert.equal(headerMap.get("X-Frame-Options"), "DENY");
  assert.equal(headerMap.get("X-Content-Type-Options"), "nosniff");
  assert.equal(
    headerMap.get("Referrer-Policy"),
    "strict-origin-when-cross-origin"
  );
  assert.match(headerMap.get("Permissions-Policy") || "", /camera=\(\)/);
  assert.match(
    headerMap.get("Content-Security-Policy") || "",
    /default-src 'self'/
  );
  assert.match(
    headerMap.get("Content-Security-Policy") || "",
    /frame-ancestors 'none'/
  );

  const viteConfig = fs.readFileSync(
    path.join(rootDir, "vite.config.js"),
    "utf8"
  );
  assert.match(viteConfig, /sourcemap:\s*false/);
});
