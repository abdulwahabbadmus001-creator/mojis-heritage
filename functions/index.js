const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

const SMTP_HOST = defineSecret("SMTP_HOST"),
  SMTP_PORT = defineSecret("SMTP_PORT"),
  SMTP_USER = defineSecret("SMTP_USER"),
  SMTP_PASS = defineSecret("SMTP_PASS"),
  CONTACT_TO_EMAIL = defineSecret("CONTACT_TO_EMAIL");

const clean = (v, max = 2000) =>
  String(v || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);

exports.submitComment = onCall({ enforceAppCheck: true }, async (req) => {
  const postId = clean(req.data?.postId, 120),
    displayName = clean(req.data?.displayName, 60),
    text = clean(req.data?.text, 1000);
  if (!postId || displayName.length < 2 || text.length < 3)
    throw new HttpsError(
      "invalid-argument",
      "Please provide a valid name and comment."
    );
  await db.collection("comments").add({
    postId,
    displayName,
    text,
    isApproved: false,
    isFlagged: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true };
});

exports.sendContact = onCall(
  {
    enforceAppCheck: true,
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL],
  },
  async (req) => {
    const name = clean(req.data?.name, 80),
      email = clean(req.data?.email, 160),
      reason = clean(req.data?.reason, 100),
      subject = clean(req.data?.subject, 140),
      note = clean(req.data?.note, 3000);
    if (
      name.length < 2 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      reason.length < 2 ||
      note.length < 10
    )
      throw new HttpsError(
        "invalid-argument",
        "Please complete all required contact fields."
      );
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST.value(),
      port: Number(SMTP_PORT.value()),
      secure: Number(SMTP_PORT.value()) === 465,
      auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() },
    });
    await transporter.sendMail({
      from: `Moji's Heritage <${SMTP_USER.value()}>`,
      to: CONTACT_TO_EMAIL.value(),
      replyTo: email,
      subject: `Website contact: ${subject || reason}`,
      text: `Name: ${name}\nEmail: ${email}\nReason: ${reason}\n\n${note}`,
    });
    return { ok: true };
  }
);

/**
 * Scheduled Background Ingestion Service (Daily at 03:00 Africa/Lagos).
 * Synchronises Nigerian cultural heritage records from Wikipedia, Wikimedia Commons,
 * and The Metropolitan Museum of Art Open Access API into Firestore `externalDiscoveries`.
 * Note: Deploying Cloud Functions requires the Firebase Blaze (pay-as-you-go) plan.
 */
exports.scheduledHeritageDiscoverySync = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Africa/Lagos",
    retryCount: 1,
  },
  async () => {
    const headers = {
      Accept: "application/json",
      "User-Agent":
        "MojisHeritageDigitalMuseum/1.0 (https://mojis-heritage-ae06c.web.app; Scheduled Cloud Function)",
    };
    const errors = [];
    let upsertedCount = 0;

    try {
      const titles = [
        "Benin_Bronzes",
        "Igbo-Ukwu",
        "Nok_culture",
        "Osun-Osogbo_Sacred_Grove",
        "Sukur_Cultural_Landscape",
        "Kingdom_of_Nri",
      ].join("|");
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=900&inprop=url&titles=${encodeURIComponent(
        titles
      )}&format=json&origin=*`;
      const res = await fetch(wikiUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        const pages = Object.values(data?.query?.pages || {});
        for (const page of pages) {
          if (!page || page.missing || !page.title || !page.extract) continue;
          const docId = `ext-wikipedia-${page.pageid}`;
          const docRef = db.collection("externalDiscoveries").doc(docId);
          const existing = await docRef.get();
          const priorData = existing.exists ? existing.data() : null;
          await docRef.set(
            {
              id: docId,
              externalId: `wiki-${page.pageid}`,
              providerId: "wikipedia_nigeria",
              providerName: "Wikipedia Heritage Archive",
              title: page.title,
              summary: page.extract.slice(0, 280),
              body: page.extract,
              coverImage: page.thumbnail?.source || "",
              sourceUrl:
                page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`,
              licence: "CC BY-SA 4.0 · Wikipedia Contributors",
              licenceVerified: true,
              trustLevel: priorData?.trustLevel || "trusted_public",
              status: priorData?.status || "Published",
              isApprovedForPublic:
                typeof priorData?.isApprovedForPublic === "boolean"
                  ? priorData.isApprovedForPublic
                  : true,
              relevanceScore: 9,
              retrievedAt: new Date().toISOString(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          upsertedCount++;
        }
      }
    } catch (err) {
      errors.push({ provider: "wikipedia_nigeria", message: err.message });
    }

    try {
      const metIds = [316516, 316520, 316521, 316522, 316524, 316525];
      for (const objectID of metIds) {
        const res = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`,
          { headers }
        );
        if (!res.ok) continue;
        const d = await res.json();
        if (!d || !d.isPublicDomain || d.country !== "Nigeria") continue;
        const docId = `ext-met-${d.objectID}`;
        const docRef = db.collection("externalDiscoveries").doc(docId);
        const existing = await docRef.get();
        const priorData = existing.exists ? existing.data() : null;
        await docRef.set(
          {
            id: docId,
            externalId: String(d.objectID),
            providerId: "met_museum",
            providerName: "The Met Open Access",
            title: `${d.title}${d.culture ? ` (${d.culture})` : ""}`,
            summary: [d.objectName, d.culture, d.objectDate, d.medium]
              .filter(Boolean)
              .join(" · "),
            body: `${d.title} (${d.objectDate || "Historic"}). Culture: ${
              d.culture || "Nigeria"
            }. Medium: ${d.medium || ""}. Credit: ${d.creditLine || ""}.`,
            ethnicGroup: /yoruba/i.test(d.culture) ? "Yoruba" : "Edo",
            state: /yoruba|ijebu/i.test(d.culture) ? "Ogun" : "Edo",
            region: /yoruba|ijebu/i.test(d.culture)
              ? "South West"
              : "South South",
            historicalPeriod: d.objectDate || "",
            material: d.medium || "",
            dimensions: d.dimensions || "",
            accessionNumber: d.accessionNumber || "",
            custodian: d.repository || "The Metropolitan Museum of Art",
            coverImage: d.primaryImageSmall || d.primaryImage || "",
            sourceUrl:
              d.objectURL ||
              `https://www.metmuseum.org/art/collection/search/${d.objectID}`,
            licence:
              "CC0 1.0 Public Domain · The Metropolitan Museum of Art Open Access",
            licenceVerified: true,
            trustLevel: priorData?.trustLevel || "trusted_public",
            status: priorData?.status || "Published",
            isApprovedForPublic:
              typeof priorData?.isApprovedForPublic === "boolean"
                ? priorData.isApprovedForPublic
                : true,
            relevanceScore: 9,
            retrievedAt: new Date().toISOString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        upsertedCount++;
      }
    } catch (err) {
      errors.push({ provider: "met_museum", message: err.message });
    }

    await db.collection("siteSettings").doc("apiSyncSummary").set(
      {
        lastScheduledSyncAt: new Date().toISOString(),
        upsertedCount,
        failedJobsCount: errors.length,
        errors,
      },
      { merge: true }
    );
  }
);
