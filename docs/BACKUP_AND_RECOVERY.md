# Moji's Heritage — Firestore & Storage Backup and Recovery Guide

## 1. Overview
Moji's Heritage stores published archival stories (`posts`), cultural destinations (`listings`), moderated visitor comments (`comments`), private contributor submissions (`submissions`), contributor correction/withdrawal requests (`correctionRequests`), external discovery records (`externalDiscoveries`), and immutable administrative audit logs (`auditLogs`) in Cloud Firestore under Firebase project `mojis-heritage-ae06c`.

## 2. Exporting a Full Firestore Backup
Authorized project owners can export all collections or specific collections to a Google Cloud Storage bucket using the Google Cloud / Firebase CLI:

```bash
# Authenticate and select project
gcloud config set project mojis-heritage-ae06c

# Export all Firestore collections
gcloud firestore export gs://mojis-heritage-ae06c-backups/$(date +%Y-%m-%d)

# Or export specific collections only
gcloud firestore export gs://mojis-heritage-ae06c-backups/$(date +%Y-%m-%d) \
  --collection-ids=posts,listings,submissions,correctionRequests,externalDiscoveries,auditLogs,siteSettings
```

## 3. Restoring from a Firestore Backup
To restore from a previous backup snapshot:

```bash
gcloud firestore import gs://mojis-heritage-ae06c-backups/YYYY-MM-DD/
```

## 4. Deploying Security Rules & Indexes
Whenever `firestore.rules`, `firestore.indexes.json`, or `storage.rules` are updated in version control, deploy them via Firebase CLI:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project mojis-heritage-ae06c
```
