import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db, firebaseReady } from "../firebase.js";
import { seedPosts, listings as seedListings } from "../data/seed.js";
import { hasConsentFor } from "../utils/consentStorage.js";
import { enrichRecordWithKnowledgeGraph } from "../data/knowledgeGraph.js";
import {
  getPublishedCommunitySubmissions,
  CONTRIBUTION_CONTENT_TYPES,
} from "./contributions.js";

export function filterPubliclyVisiblePosts(records = []) {
  return (Array.isArray(records) ? records : [])
    .filter((item) => {
      if (!item || typeof item !== "object") return false;
      if (item.isPublished !== true) return false;
      if (
        item.status &&
        [
          "Draft",
          "Submitted",
          "Pending Review",
          "Needs Correction",
          "Approved",
          "Rejected",
          "Archived",
          "Withdrawn",
        ].includes(item.status)
      ) {
        return false;
      }
      return true;
    })
    .map(enrichRecordWithKnowledgeGraph);
}

function mapPublishedSubmissionToPost(sub) {
  const typeDef =
    CONTRIBUTION_CONTENT_TYPES.find((t) => t.value === sub.contentType) ||
    CONTRIBUTION_CONTENT_TYPES[0];
  return enrichRecordWithKnowledgeGraph({
    id: sub.publishedPostId || `contrib-${sub.id}`,
    submissionId: sub.id,
    referenceCode: sub.referenceCode,
    title: sub.title,
    category: typeDef.targetCategory,
    ethnicGroup: sub.ethnicGroup,
    state: sub.state,
    locality: sub.locality,
    region: sub.region || "Nigeria",
    historicalPeriod: sub.historicalPeriod,
    classification: sub.classification,
    custodian: sub.custodianOrCreator || "Community-Contributed Record",
    summary: sub.summary,
    body: `${sub.body}\n\n## Sources & Archival References\n${sub.sourcesAndReferences}\n\n*Contributed by: ${sub.contributorName} (${sub.referenceCode})*`,
    coverImage:
      sub.mediaUrl ||
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1000&q=70",
    sourceType: "community",
    sourceLabel: "Community-Contributed · Admin Approved",
    verificationStatus: "Admin-Verified Contribution",
    licence: sub.copyrightDeclaration,
    citations: [sub.sourcesAndReferences],
    status: "Published",
    isApproved: true,
    isPublished: true,
    views: Number(sub.views || 0),
  });
}

export async function getPosts() {
  let basePosts = seedPosts;
  if (firebaseReady && db) {
    try {
      const s = await getDocs(
        query(collection(db, "posts"), where("isPublished", "==", true))
      );
      if (!s.empty) {
        basePosts = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch {
      basePosts = seedPosts;
    }
  }

  const publishedSubmissions = await getPublishedCommunitySubmissions();
  const mappedCommunityPosts = publishedSubmissions.map(
    mapPublishedSubmissionToPost
  );

  const byId = new Map();
  for (const post of [...mappedCommunityPosts, ...basePosts]) {
    if (post && post.id && !byId.has(post.id)) {
      byId.set(post.id, post);
    }
  }

  return filterPubliclyVisiblePosts(Array.from(byId.values()));
}

export async function getListings() {
  if (!firebaseReady || !db) return seedListings;
  try {
    const s = await getDocs(
      query(collection(db, "listings"), where("isPublished", "==", true))
    );
    return s.empty
      ? seedListings
      : s.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return seedListings;
  }
}

export async function getAll(name) {
  if (!firebaseReady || !db) {
    if (name === "posts") return seedPosts.map(enrichRecordWithKnowledgeGraph);
    if (name === "listings") return seedListings;
    return [];
  }
  const s = await getDocs(collection(db, name));
  const docs = s.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (name === "posts") {
    return docs.length > 0
      ? docs.map(enrichRecordWithKnowledgeGraph)
      : seedPosts.map(enrichRecordWithKnowledgeGraph);
  }
  if (name === "listings" && docs.length === 0) {
    return seedListings;
  }
  return docs;
}

export async function createItem(name, data) {
  if (!firebaseReady) throw new Error("Add Firebase values to .env first.");
  return addDoc(collection(db, name), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateItem(name, id, data) {
  return updateDoc(doc(db, name, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeItem(name, id) {
  return deleteDoc(doc(db, name, id));
}

export async function bumpView(id) {
  if (!hasConsentFor("analytics")) return;
  if (firebaseReady && db) {
    try {
      await updateDoc(doc(db, "posts", id), { views: increment(1) });
    } catch {
      // Ignore analytics write failures on seed items
    }
  }
}

export async function getSiteSettings() {
  if (!firebaseReady || !db) {
    return {
      aboutTitle: "About Moji's Heritage",
      aboutBody:
        "Moji's Heritage is a digital home for learning about Nigeria's histories, peoples, languages, festivals, foods, landmarks and living traditions.",
      vision:
        "To make Nigeria's diverse cultural heritage accessible, engaging and discoverable for present and future generations.",
      mission:
        "To document, teach and share trustworthy cultural knowledge while connecting readers with the places and communities that keep heritage alive.",
    };
  }
  try {
    const s = await getDoc(doc(db, "siteSettings", "general"));
    return s.exists() ? s.data() : {};
  } catch {
    return {};
  }
}

export async function saveSiteSettings(data) {
  if (!firebaseReady) throw new Error("Firebase is not configured.");
  return setDoc(
    doc(db, "siteSettings", "general"),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
