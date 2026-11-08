import {
  addDoc,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase.js";

export const SUBMISSIONS_STORAGE_KEY = "mojis_private_submissions_v1";
export const CORRECTIONS_STORAGE_KEY = "mojis_correction_requests_v1";
export const AUDIT_LOG_STORAGE_KEY = "mojis_admin_audit_logs_v1";
export const SUBMISSION_RATE_LIMIT_KEY = "mojis_submission_rate_limit_v1";

export const SUBMISSION_STATUSES = [
  "Draft",
  "Submitted",
  "Pending Review",
  "Needs Correction",
  "Approved",
  "Published",
  "Rejected",
  "Archived",
  "Withdrawn",
];

export const CONTRIBUTION_CONTENT_TYPES = [
  { value: "artifact", label: "Artifact Record", targetCategory: "heritage" },
  { value: "history", label: "Historical Article", targetCategory: "histories" },
  { value: "oral_history", label: "Oral History / Testimony", targetCategory: "heritage" },
  { value: "festival", label: "Festival or Ceremony Description", targetCategory: "festivals" },
  { value: "media", label: "Photograph / Archival Media", targetCategory: "gallery" },
  { value: "terminology", label: "Indigenous Terminology / Language Note", targetCategory: "languages" },
  { value: "hero", label: "Historical Figure / Custodian Biography", targetCategory: "heroes" },
  { value: "heritage_site", label: "Heritage Site / Monument Documentation", targetCategory: "heritage" },
  { value: "correction", label: "Source Citation / Record Correction", targetCategory: "histories" },
];

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_ATTACHMENT_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export function sanitizeSubmissionText(value, maxLength = 8000) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .trim()
    .slice(0, maxLength);
}

export function validateAttachmentFileMeta(fileMeta = {}) {
  if (!fileMeta || (!fileMeta.name && !fileMeta.type && !fileMeta.size)) {
    return { valid: true };
  }
  const mime = String(fileMeta.type || "").toLowerCase();
  const size = Number(fileMeta.size || 0);
  const name = String(fileMeta.name || "").toLowerCase();

  if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(mime)) {
    return {
      valid: false,
      error: `Unsupported file type "${mime || name}". Only JPG, PNG, WebP images and PDF source documents are permitted.`,
    };
  }
  if (size <= 0 || size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: "File exceeds the 8 MB maximum upload limit.",
    };
  }
  if (/\.(exe|bat|cmd|sh|js|mjs|php|py|html|svg)$/i.test(name)) {
    return {
      valid: false,
      error: "Executable or script extensions are strictly prohibited.",
    };
  }
  return { valid: true };
}

export function generateSubmissionReferenceCode(now = new Date()) {
  const year = now.getUTCFullYear();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MH-SUB-${year}-${randomPart}`;
}

export function computeSubmissionFingerprint(payload = {}) {
  const title = sanitizeSubmissionText(payload.title, 200).toLowerCase();
  const community = sanitizeSubmissionText(payload.ethnicGroup, 80).toLowerCase();
  const bodyStart = sanitizeSubmissionText(payload.body, 200).toLowerCase();
  return `${title}::${community}::${bodyStart}`;
}

export function isSubmissionPubliclyVisible(record = {}) {
  if (!record || typeof record !== "object") return false;
  return (
    record.status === "Published" &&
    record.isPublished === true &&
    record.isApproved === true
  );
}

export function validatePublicSubmission(input = {}) {
  const errors = [];
  const title = sanitizeSubmissionText(input.title, 180);
  const contentType = sanitizeSubmissionText(input.contentType, 60);
  const summary = sanitizeSubmissionText(input.summary, 500);
  const body = sanitizeSubmissionText(input.body, 12000);
  const state = sanitizeSubmissionText(input.state, 80);
  const locality = sanitizeSubmissionText(input.locality, 140);
  const ethnicGroup = sanitizeSubmissionText(input.ethnicGroup, 100);
  const language = sanitizeSubmissionText(input.language, 100);
  const historicalPeriod = sanitizeSubmissionText(input.historicalPeriod, 140);
  const classification = sanitizeSubmissionText(input.classification, 140);
  const custodianOrCreator = sanitizeSubmissionText(input.custodianOrCreator, 180);
  const sourcesAndReferences = sanitizeSubmissionText(input.sourcesAndReferences, 2000);
  const contributorName = sanitizeSubmissionText(input.contributorName, 120);
  const attributionPreference = sanitizeSubmissionText(
    input.attributionPreference || "Named Contributor",
    80
  );
  const contactEmail = sanitizeSubmissionText(input.contactEmail, 140);
  const mediaUrl = sanitizeSubmissionText(input.mediaUrl, 600);
  const copyrightDeclaration = sanitizeSubmissionText(input.copyrightDeclaration, 500);

  if (title.length < 5) {
    errors.push("Please provide a descriptive title (at least 5 characters).");
  }
  if (!CONTRIBUTION_CONTENT_TYPES.some((t) => t.value === contentType)) {
    errors.push("Please select a valid contribution content type.");
  }
  if (body.length < 30) {
    errors.push(
      "Please provide a detailed cultural or historical description (at least 30 characters)."
    );
  }
  if (!state) {
    errors.push("Please select the relevant Nigerian state or national scope.");
  }
  if (!ethnicGroup) {
    errors.push("Please specify the Nigerian cultural community / ethnic group.");
  }
  if (!historicalPeriod) {
    errors.push(
      "Please select a historical period or choose 'Unknown', 'Approximate', or 'Disputed'."
    );
  }
  if (!sourcesAndReferences || sourcesAndReferences.length < 5) {
    errors.push(
      "Please cite at least one source, oral custodian, publication, or archival reference."
    );
  }
  if (!contributorName && attributionPreference !== "Anonymous") {
    errors.push(
      "Please enter your contributor name or select 'Anonymous' attribution."
    );
  }
  if (!copyrightDeclaration) {
    errors.push("Please select a copyright / rights status declaration.");
  }
  if (input.consentToReview !== true) {
    errors.push(
      "You must consent to Moji's Heritage storing and reviewing your submission."
    );
  }
  if (input.consentToPublishIfApproved !== true) {
    errors.push(
      "You must grant permission for Moji's Heritage to publish the record if approved by an administrator."
    );
  }
  if (input.rightsConfirmation !== true) {
    errors.push(
      "You must confirm that you have the right to submit this material and that it does not infringe third-party rights."
    );
  }
  if (input.hasIdentifiableMedia === true && input.identifiableMediaConsent !== true) {
    errors.push(
      "When submitting identifiable photographs or oral recordings of living persons, informed consent confirmation is required."
    );
  }
  if (input.attachmentMeta) {
    const fileCheck = validateAttachmentFileMeta(input.attachmentMeta);
    if (!fileCheck.valid) {
      errors.push(fileCheck.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      title,
      contentType,
      summary: summary || body.slice(0, 220),
      body,
      state,
      locality,
      ethnicGroup,
      language,
      historicalPeriod,
      classification: classification || "Oral History, Festival & Living Tradition",
      custodianOrCreator,
      sourcesAndReferences,
      contributorName: attributionPreference === "Anonymous" ? "Anonymous Contributor" : contributorName,
      attributionPreference,
      contactEmail,
      mediaUrl,
      copyrightDeclaration,
      consentToReview: Boolean(input.consentToReview),
      consentToPublishIfApproved: Boolean(input.consentToPublishIfApproved),
      rightsConfirmation: Boolean(input.rightsConfirmation),
      hasIdentifiableMedia: Boolean(input.hasIdentifiableMedia),
      identifiableMediaConsent: Boolean(input.identifiableMediaConsent),
      attachmentMeta: input.attachmentMeta
        ? {
            name: sanitizeSubmissionText(input.attachmentMeta.name, 160),
            type: sanitizeSubmissionText(input.attachmentMeta.type, 80),
            size: Number(input.attachmentMeta.size || 0),
          }
        : null,
    },
  };
}

function readLocalArray(key, storage) {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
      ? window.localStorage
      : null;
  if (!targetStorage || typeof targetStorage.getItem !== "function") return [];
  try {
    const raw = targetStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalArray(key, items, storage) {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== "undefined"
      ? window.localStorage
      : null;
  if (!targetStorage || typeof targetStorage.setItem !== "function") return;
  try {
    targetStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

export async function recordAdminAuditEvent(
  {
    action,
    targetType = "submission",
    targetId = "",
    targetTitle = "",
    previousStatus = "",
    newStatus = "",
    adminEmail = "admin",
    notes = "",
  },
  storage
) {
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action: sanitizeSubmissionText(action, 120),
    targetType: sanitizeSubmissionText(targetType, 60),
    targetId: sanitizeSubmissionText(targetId, 120),
    targetTitle: sanitizeSubmissionText(targetTitle, 200),
    previousStatus: sanitizeSubmissionText(previousStatus, 60),
    newStatus: sanitizeSubmissionText(newStatus, 60),
    adminEmail: sanitizeSubmissionText(adminEmail, 120),
    notes: sanitizeSubmissionText(notes, 600),
    timestamp: new Date().toISOString(),
  };

  const existing = readLocalArray(AUDIT_LOG_STORAGE_KEY, storage);
  writeLocalArray(AUDIT_LOG_STORAGE_KEY, [entry, ...existing].slice(0, 250), storage);

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "auditLogs"), {
        ...entry,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Local audit log preserved if Firestore rules/network unavailable
    }
  }
  return entry;
}

export async function getAdminAuditLogs(storage) {
  const localLogs = readLocalArray(AUDIT_LOG_STORAGE_KEY, storage);
  if (!isFirebaseConfigured || !db) return localLogs;
  try {
    const snap = await getDocs(collection(db, "auditLogs"));
    if (snap.empty) return localLogs;
    const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const byId = new Map();
    for (const item of [...remote, ...localLogs]) {
      if (item && item.id && !byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      String(b.timestamp || "").localeCompare(String(a.timestamp || ""))
    );
  } catch {
    return localLogs;
  }
}

export async function createPublicSubmission(input = {}, options = {}) {
  const storage = options.storage;
  if (input.honeypot && String(input.honeypot).trim() !== "") {
    throw new Error("Automated spam submission blocked.");
  }

  const validation = validatePublicSubmission(input);
  if (!validation.valid) {
    const err = new Error(validation.errors[0]);
    err.validationErrors = validation.errors;
    throw err;
  }

  const sanitized = validation.sanitized;
  const fingerprint = computeSubmissionFingerprint(sanitized);
  const existing = readLocalArray(SUBMISSIONS_STORAGE_KEY, storage);

  const duplicate = existing.find(
    (item) =>
      item.fingerprint === fingerprint &&
      item.status !== "Withdrawn" &&
      item.status !== "Rejected"
  );
  if (duplicate) {
    throw new Error(
      `A matching submission ("${duplicate.title}") is already on file with reference ${duplicate.referenceCode}.`
    );
  }

  const nowIso = new Date().toISOString();
  const referenceCode = generateSubmissionReferenceCode();
  const submissionRecord = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    referenceCode,
    fingerprint,
    ...sanitized,
    // Strict workflow state: never approved or published upon public creation
    status: "Pending Review",
    workflowHistory: ["Submitted", "Pending Review"],
    isApproved: false,
    isPublished: false,
    publishedPostId: null,
    reviewerNotes: "",
    citationVerified: false,
    permissionVerified: Boolean(
      sanitized.consentToReview &&
        sanitized.consentToPublishIfApproved &&
        sanitized.rightsConfirmation
    ),
    submittedAt: nowIso,
    updatedAt: nowIso,
    revisions: [
      {
        version: 1,
        timestamp: nowIso,
        actor: sanitized.contributorName || "Public Contributor",
        action: "Initial Submission",
        previousStatus: "Submitted",
        newStatus: "Pending Review",
        summary: "Submitted via public Contribute to the Archive portal.",
        snapshot: {
          title: sanitized.title,
          summary: sanitized.summary,
          body: sanitized.body,
          sourcesAndReferences: sanitized.sourcesAndReferences,
        },
      },
    ],
  };

  writeLocalArray(
    SUBMISSIONS_STORAGE_KEY,
    [submissionRecord, ...existing],
    storage
  );

  if (isFirebaseConfigured && db && !options.skipFirestore) {
    try {
      await setDoc(doc(db, "submissions", submissionRecord.id), {
        ...submissionRecord,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Stored in private queue if offline
    }
  }

  return submissionRecord;
}

/**
 * Admin-only: retrieves all submissions across all workflow states.
 */
export async function getAllSubmissionsForAdmin(options = {}) {
  const storage = options.storage;
  const localItems = readLocalArray(SUBMISSIONS_STORAGE_KEY, storage);
  if (!isFirebaseConfigured || !db || options.skipFirestore) {
    return localItems;
  }
  try {
    const snap = await getDocs(collection(db, "submissions"));
    if (snap.empty) return localItems;
    const remoteItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const mergedMap = new Map();
    for (const item of [...remoteItems, ...localItems]) {
      if (item && item.id && !mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    }
    const merged = Array.from(mergedMap.values()).sort((a, b) =>
      String(b.submittedAt || "").localeCompare(String(a.submittedAt || ""))
    );
    writeLocalArray(SUBMISSIONS_STORAGE_KEY, merged, storage);
    return merged;
  } catch {
    return localItems;
  }
}

/**
 * Public-safe query: returns ONLY submissions from local/session state that have been
 * both Approved AND Published.
 * IMPORTANT: Never queries the private `submissions` Firestore collection from public pages
 * (since `submissions` is strictly `allow read: if admin()` in firestore.rules, and
 * admin-published submissions are written directly to the public `posts` collection).
 */
export async function getPublishedCommunitySubmissions(options = {}) {
  const storage = options.storage;
  const localItems = readLocalArray(SUBMISSIONS_STORAGE_KEY, storage);
  return localItems.filter((item) => isSubmissionPubliclyVisible(item));
}

async function persistSubmissionUpdate(updatedRecord, options = {}) {
  const storage = options.storage;
  const all = readLocalArray(SUBMISSIONS_STORAGE_KEY, storage);
  const next = all.some((item) => item.id === updatedRecord.id)
    ? all.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
    : [updatedRecord, ...all];
  writeLocalArray(SUBMISSIONS_STORAGE_KEY, next, storage);

  if (isFirebaseConfigured && db && !options.skipFirestore) {
    try {
      await setDoc(
        doc(db, "submissions", updatedRecord.id),
        {
          ...updatedRecord,
          updatedAtServer: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Local state already updated
    }
  }
  return updatedRecord;
}

/**
 * Admin Action 1: Approve submission (Marks as Approved, does NOT publish to public site yet).
 */
export async function approveSubmission(
  submissionId,
  {
    adminEmail = "admin",
    reviewerNotes = "",
    citationVerified = true,
    permissionVerified = true,
    editedFields = {},
    storage,
    skipFirestore = false,
  } = {}
) {
  const all = await getAllSubmissionsForAdmin({ storage, skipFirestore });
  const target = all.find((item) => item.id === submissionId);
  if (!target) {
    throw new Error(`Submission ${submissionId} not found.`);
  }

  const nowIso = new Date().toISOString();
  const nextTitle = editedFields.title
    ? sanitizeSubmissionText(editedFields.title, 180)
    : target.title;
  const nextSummary = editedFields.summary
    ? sanitizeSubmissionText(editedFields.summary, 500)
    : target.summary;
  const nextBody = editedFields.body
    ? sanitizeSubmissionText(editedFields.body, 12000)
    : target.body;

  const updated = {
    ...target,
    ...editedFields,
    title: nextTitle,
    summary: nextSummary,
    body: nextBody,
    status: "Approved",
    isApproved: true,
    // Strictly keep isPublished false until explicit publishSubmission call
    isPublished: false,
    citationVerified: Boolean(citationVerified),
    permissionVerified: Boolean(permissionVerified),
    reviewerNotes: sanitizeSubmissionText(
      reviewerNotes || target.reviewerNotes,
      1000
    ),
    approvedBy: adminEmail,
    approvedAt: nowIso,
    updatedAt: nowIso,
    revisions: [
      ...(Array.isArray(target.revisions) ? target.revisions : []),
      {
        version: (target.revisions?.length || 1) + 1,
        timestamp: nowIso,
        actor: adminEmail,
        action: "Approved (Awaiting Publication)",
        previousStatus: target.status,
        newStatus: "Approved",
        summary: reviewerNotes || "Approved by administrator; ready for publication.",
        snapshot: {
          title: nextTitle,
          summary: nextSummary,
          body: nextBody,
          sourcesAndReferences: target.sourcesAndReferences,
        },
      },
    ],
  };

  await persistSubmissionUpdate(updated, { storage, skipFirestore });
  await recordAdminAuditEvent(
    {
      action: "APPROVE_SUBMISSION",
      targetType: "submission",
      targetId: updated.id,
      targetTitle: updated.title,
      previousStatus: target.status,
      newStatus: "Approved",
      adminEmail,
      notes: reviewerNotes || "Submission approved (not yet published).",
    },
    storage
  );

  return updated;
}

/**
 * Admin Action 2: Publish an approved submission to the public archive.
 * Requires the submission to be Approved first (unless forceApproveAndPublish is explicitly set by admin).
 */
export async function publishSubmission(
  submissionId,
  {
    adminEmail = "admin",
    reviewerNotes = "",
    publishPostCallback = null,
    storage,
    skipFirestore = false,
  } = {}
) {
  const all = await getAllSubmissionsForAdmin({ storage, skipFirestore });
  const target = all.find((item) => item.id === submissionId);
  if (!target) {
    throw new Error(`Submission ${submissionId} not found.`);
  }
  if (target.status !== "Approved" && target.status !== "Published") {
    throw new Error(
      `Submission must be in "Approved" status before publication (current status: "${target.status}"). Approve the submission first.`
    );
  }

  const nowIso = new Date().toISOString();
  const typeDef =
    CONTRIBUTION_CONTENT_TYPES.find((t) => t.value === target.contentType) ||
    CONTRIBUTION_CONTENT_TYPES[0];

  const publicPostPayload = {
    id: target.publishedPostId || `contrib-${target.id}`,
    submissionId: target.id,
    referenceCode: target.referenceCode,
    title: target.title,
    category: typeDef.targetCategory,
    ethnicGroup: target.ethnicGroup,
    state: target.state,
    locality: target.locality,
    region: target.region || "Nigeria",
    historicalPeriod: target.historicalPeriod,
    classification: target.classification,
    custodian: target.custodianOrCreator || "Community-Contributed Record",
    summary: target.summary,
    body: `${target.body}\n\n## Sources & Archival References\n${target.sourcesAndReferences}\n\n*Contributed by: ${target.contributorName} (${target.referenceCode})*`,
    coverImage:
      target.mediaUrl ||
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1000&q=70",
    sourceType: "community",
    sourceLabel: "Community-Contributed · Admin Approved",
    verificationStatus: "Admin-Verified Contribution",
    licence: target.copyrightDeclaration,
    citations: [target.sourcesAndReferences],
    isPublished: true,
    views: 0,
    publishedAt: nowIso,
  };

  if (typeof publishPostCallback === "function") {
    await publishPostCallback(publicPostPayload);
  } else if (isFirebaseConfigured && db && !skipFirestore) {
    try {
      await setDoc(
        doc(db, "posts", publicPostPayload.id),
        {
          ...publicPostPayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Fallback handled by getPublishedmerged feed
    }
  }

  const updated = {
    ...target,
    status: "Published",
    isApproved: true,
    isPublished: true,
    publishedPostId: publicPostPayload.id,
    publishedBy: adminEmail,
    publishedAt: nowIso,
    updatedAt: nowIso,
    reviewerNotes: sanitizeSubmissionText(
      reviewerNotes || target.reviewerNotes,
      1000
    ),
    revisions: [
      ...(Array.isArray(target.revisions) ? target.revisions : []),
      {
        version: (target.revisions?.length || 1) + 1,
        timestamp: nowIso,
        actor: adminEmail,
        action: "Published to Public Archive",
        previousStatus: target.status,
        newStatus: "Published",
        summary: reviewerNotes || "Published to Moji's Heritage public collection.",
        snapshot: {
          title: target.title,
          summary: target.summary,
          body: target.body,
          sourcesAndReferences: target.sourcesAndReferences,
        },
      },
    ],
  };

  await persistSubmissionUpdate(updated, { storage, skipFirestore });
  await recordAdminAuditEvent(
    {
      action: "PUBLISH_SUBMISSION",
      targetType: "submission",
      targetId: updated.id,
      targetTitle: updated.title,
      previousStatus: target.status,
      newStatus: "Published",
      adminEmail,
      notes: reviewerNotes || `Published as record ${publicPostPayload.id}.`,
    },
    storage
  );

  return { submission: updated, publishedPost: publicPostPayload };
}

export async function transitionSubmissionStatus(
  submissionId,
  newStatus,
  { adminEmail = "admin", reviewerNotes = "", storage, skipFirestore = false } = {}
) {
  if (!SUBMISSION_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid workflow status: ${newStatus}`);
  }
  const all = await getAllSubmissionsForAdmin({ storage, skipFirestore });
  const target = all.find((item) => item.id === submissionId);
  if (!target) {
    throw new Error(`Submission ${submissionId} not found.`);
  }

  const nowIso = new Date().toISOString();
  const isPublished = newStatus === "Published";
  const isApproved = newStatus === "Approved" || newStatus === "Published";

  const updated = {
    ...target,
    status: newStatus,
    isApproved,
    isPublished,
    reviewerNotes: sanitizeSubmissionText(
      reviewerNotes || target.reviewerNotes,
      1000
    ),
    updatedAt: nowIso,
    revisions: [
      ...(Array.isArray(target.revisions) ? target.revisions : []),
      {
        version: (target.revisions?.length || 1) + 1,
        timestamp: nowIso,
        actor: adminEmail,
        action: `Status changed to ${newStatus}`,
        previousStatus: target.status,
        newStatus,
        summary: reviewerNotes || `Workflow transition to ${newStatus}.`,
        snapshot: {
          title: target.title,
          summary: target.summary,
          body: target.body,
          sourcesAndReferences: target.sourcesAndReferences,
        },
      },
    ],
  };

  await persistSubmissionUpdate(updated, { storage, skipFirestore });
  await recordAdminAuditEvent(
    {
      action: `STATUS_${newStatus.toUpperCase().replace(/\s+/g, "_")}`,
      targetType: "submission",
      targetId: updated.id,
      targetTitle: updated.title,
      previousStatus: target.status,
      newStatus,
      adminEmail,
      notes: reviewerNotes,
    },
    storage
  );

  return updated;
}

export async function submitCorrectionOrWithdrawalRequest(
  input = {},
  options = {}
) {
  const storage = options.storage;
  const referenceOrRecordId = sanitizeSubmissionText(
    input.referenceOrRecordId,
    140
  );
  const requestType = sanitizeSubmissionText(
    input.requestType || "Factual / Cultural Correction",
    80
  );
  const requesterName = sanitizeSubmissionText(input.requesterName, 120);
  const contactEmail = sanitizeSubmissionText(input.contactEmail, 140);
  const details = sanitizeSubmissionText(input.details, 3000);
  const sources = sanitizeSubmissionText(input.sources, 1500);

  if (!referenceOrRecordId) {
    throw new Error(
      "Please enter the Submission Reference Code or the Title/ID of the record."
    );
  }
  if (!details || details.length < 15) {
    throw new Error(
      "Please describe the requested correction, attribution update, or withdrawal reason."
    );
  }

  const nowIso = new Date().toISOString();
  const requestRecord = {
    id: `corr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    referenceCode: `MH-REQ-${new Date().getUTCFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`,
    referenceOrRecordId,
    requestType,
    requesterName: requesterName || "Visitor / Contributor",
    contactEmail,
    details,
    sources,
    status: "Pending Review",
    createdAtIso: nowIso,
  };

  const existing = readLocalArray(CORRECTIONS_STORAGE_KEY, storage);
  writeLocalArray(CORRECTIONS_STORAGE_KEY, [requestRecord, ...existing], storage);

  if (isFirebaseConfigured && db && !options.skipFirestore) {
    try {
      await setDoc(doc(db, "correctionRequests", requestRecord.id), {
        ...requestRecord,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Stored locally if Firestore write is offline
    }
  }

  return requestRecord;
}

export async function getAllCorrectionRequestsForAdmin(options = {}) {
  const storage = options.storage;
  const localItems = readLocalArray(CORRECTIONS_STORAGE_KEY, storage);
  if (!isFirebaseConfigured || !db || options.skipFirestore) {
    return localItems;
  }
  try {
    const snap = await getDocs(collection(db, "correctionRequests"));
    if (snap.empty) return localItems;
    const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const mergedMap = new Map();
    for (const item of [...remote, ...localItems]) {
      if (item && item.id && !mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    }
    return Array.from(mergedMap.values());
  } catch {
    return localItems;
  }
}

export async function resolveCorrectionRequest(
  requestId,
  { status = "Resolved", adminEmail = "admin", resolutionNotes = "", storage } = {}
) {
  const items = readLocalArray(CORRECTIONS_STORAGE_KEY, storage);
  const updatedList = items.map((item) =>
    item.id === requestId
      ? {
          ...item,
          status,
          resolutionNotes: sanitizeSubmissionText(resolutionNotes, 800),
          resolvedBy: adminEmail,
          resolvedAt: new Date().toISOString(),
        }
      : item
  );
  writeLocalArray(CORRECTIONS_STORAGE_KEY, updatedList, storage);
  const target = updatedList.find((i) => i.id === requestId);
  if (isFirebaseConfigured && db && target) {
    try {
      await updateDoc(doc(db, "correctionRequests", requestId), {
        status,
        resolutionNotes: target.resolutionNotes,
        resolvedBy: adminEmail,
        resolvedAt: target.resolvedAt,
      });
    } catch {
      // Local state updated
    }
  }
  await recordAdminAuditEvent(
    {
      action: `CORRECTION_${status.toUpperCase()}`,
      targetType: "correctionRequest",
      targetId: requestId,
      targetTitle: target?.referenceOrRecordId || requestId,
      previousStatus: "Pending Review",
      newStatus: status,
      adminEmail,
      notes: resolutionNotes,
    },
    storage
  );
  return target;
}
