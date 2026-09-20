# Moji's Heritage

A public Nigerian cultural-heritage learning, discovery and tourism website with a separate, secured Firebase admin newsroom.

## Public experience — no login
Visitors can read stories, histories, festivals, traditions, foods and language features; explore the Visit Planner and map; open the configured YouTube channel; share pages using the device share sheet (WhatsApp, Facebook, X and other installed apps); submit moderated comments; read About Us, Vision, Mission and Privacy Policy; and send a professional Contact Us message.

## Contact Us
The public `/contact` form asks for name, email, reason, subject and message. It does **not** put enquiries in the admin dashboard. The `sendContact` Firebase Cloud Function sends the enquiry directly to the website contact email configured in Firebase Functions secrets.

Configure these secrets before deploying Functions:

```bash
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set CONTACT_TO_EMAIL
```

`CONTACT_TO_EMAIL` is the website email that should receive contact messages. `SMTP_USER`/`SMTP_PASS` are the sending mailbox credentials or app password supplied by your email provider. Do not put them in Vite `.env` or GitHub.

## Secured admin newsroom
`/admin` is separate from the visitor site. Admins sign in using Firebase Email/Password with their Gmail/email address and a separate Moji's Heritage password. Public users never need an account.

The admin can:
- create, edit, publish, unpublish and delete stories across all content categories;
- upload cover images to Firebase Storage;
- add individual YouTube video links;
- create/edit Visit Planner destinations and map coordinates;
- upload destination images;
- approve, flag and delete visitor comments;
- edit the public About Us, Our Vision and Our Mission text;
- view the analytics area.

### Important: email/password is only authentication
Real authorization uses a Firebase Auth custom claim: `admin: true`. Firestore and Storage rules check this server-issued claim. Discovering `/admin`, editing React code in the browser, or knowing an administrator's email does not grant database write access.

## Create the first admin securely
1. In Firebase Console → Authentication, enable **Email/Password**.
2. Create the administrator account using the Gmail/email address and a strong **separate Moji's Heritage password**.
3. Firebase Console → Project settings → Service accounts → create/download a service-account JSON for this one-time local operation.
4. Keep that JSON outside the project. Never upload it to GitHub.
5. From the project folder run `npm install`.
6. Set `GOOGLE_APPLICATION_CREDENTIALS` to the service-account JSON path and run the one-time claim utility:

Windows PowerShell:
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\serviceAccount.json"
npm run set-admin -- admin@gmail.com
```

7. Sign out and sign back in at `/admin` so Firebase issues a new token containing `admin: true`.
8. Delete or securely archive the downloaded service-account file when you no longer need it.

For two admins, repeat step 6 with the second account.

## Security design
- Admin login: Firebase Email/Password.
- Admin authorization: Firebase custom claim, not frontend email checks.
- Firestore: only published posts/listings and approved comments are public.
- Firestore writes to content: admin claim required.
- Storage uploads: admin claim required, images only, maximum 8 MB.
- Anonymous comments: direct Firestore creation is denied; comments go through the `submitComment` Cloud Function.
- Contact messages: sent through the `sendContact` Cloud Function; SMTP credentials stay server-side.
- Firebase App Check: supported through `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`; enable enforcement for Firestore, Storage and Functions in Firebase Console before production.
- `.env`, service-account JSON files and Functions secrets are excluded from Git.

For stronger admin protection, enable multi-factor authentication/Identity Platform for administrator accounts if your Firebase plan/configuration supports it.

## Start locally
```bash
npm install
npm run dev
```

The public site has fallback seed content before Firebase is configured. Live admin publishing, comments, contact email and uploads require Firebase.

## Firebase setup
1. Create a Firebase project and Web App.
2. Enable Authentication → Email/Password.
3. Enable Firestore and Storage.
4. Copy `.env.example` to `.env` and add your public Firebase Web App configuration.
5. Add `VITE_YOUTUBE_CHANNEL_URL`.
6. Configure reCAPTCHA Enterprise/App Check and add `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` for production.
7. Install Firebase CLI: `npm install -g firebase-tools`.
8. Login: `firebase login`.
9. Install Functions dependencies: `cd functions && npm install && cd ..`.
10. Configure the five email secrets listed above.
11. Deploy backend/security: `firebase deploy --only firestore:rules,storage,functions`.
12. Build: `npm run build`.
13. Deploy Hosting if desired: `firebase deploy --only hosting`.

## YouTube
Set the public channel once in `.env`:
```env
VITE_YOUTUBE_CHANNEL_URL=https://www.youtube.com/@YourChannel
```
The navigation opens that channel in a new tab. Admins can also add a specific YouTube URL to individual documentary/story posts.

## GitHub safety
Before pushing:
```bash
git status
```
Never commit `.env`, SMTP passwords, Google/Firebase service-account JSON or any administrative secret. Firebase Web App config values are public identifiers; authorization is enforced by Firebase Auth claims and security rules.
