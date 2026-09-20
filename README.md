<div align="center">

# Moji's Heritage

### Preserving Nigerian heritage through technology

A digital cultural-heritage platform for discovering Nigerian histories, traditions, festivals, languages, foods, people and heritage destinations — supported by a secure content-management newsroom.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![i18next](https://img.shields.io/badge/i18next-26A69A?style=for-the-badge&logo=i18next&logoColor=white)

</div>

---

## About the Project

Moji's Heritage is a public-facing Nigerian cultural learning, discovery and tourism platform. It combines cultural storytelling with practical discovery tools so visitors can learn about Nigerian heritage while exploring festivals, destinations, languages and traditions.

The platform also includes a separate secured admin newsroom for managing published content without exposing administrative privileges to public visitors.

## Core Features

| Feature | What it does |
|---|---|
| 📖 **Stories & Posts** | Publishes cultural heritage, festivals, documentaries, short histories, heroes and heroines, foods, languages and related stories. |
| 🧭 **Visit Planner** | Helps visitors discover heritage sites and cultural destinations with location and travel information. |
| 🗺️ **Interactive Maps** | Uses map coordinates to provide geographical context for destinations. |
| 🏛️ **Culture Explorer** | Organises cultural information into an accessible exploration experience. |
| 📅 **Festival Calendar** | Makes Nigerian cultural festivals and events easier to discover. |
| 🔎 **Search** | Helps visitors quickly locate relevant heritage content. |
| 🔖 **Saved Articles** | Allows visitors to save interesting content for later access on their device. |
| 🕘 **Recently Viewed** | Makes it easier for visitors to return to content they recently explored. |
| 💬 **Moderated Comments** | Visitors can submit opinions and comments, which remain unpublished until approved by an administrator. |
| 📧 **Contact Us** | Sends website enquiries to the Moji's Heritage inbox through Web3Forms. |
| ▶️ **YouTube Integration** | Connects visitors with documentary and audiovisual heritage content. |
| 🌍 **Multilingual Foundation** | Uses i18next with language resources for English, Yoruba, Hausa, Igbo and Nigerian Pidgin. |
| 📱 **Responsive Interface** | Designed for desktop and mobile visitors. |
| 🔐 **Admin Newsroom** | Provides authorised administrators with tools for managing the website's content. |

## Admin Newsroom

The `/admin` area is separate from the public experience. Administrators authenticate through Firebase Authentication, while administrative authorization is enforced using the server-issued Firebase custom claim:

```text
admin: true
```

Authorised administrators can:

- create and edit stories;
- publish and unpublish content;
- delete content;
- manage Visit Planner destinations;
- maintain map/location information;
- approve and delete visitor comments;
- update About Us, Vision and Mission information;
- manage public site information; and
- access the administrative dashboard.

Knowing an administrator's email address or discovering the `/admin` route does not grant administrative database privileges.

## Technology Stack

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css&logoColor=white)

### Backend & Data

![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Cloud_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Firebase Auth](https://img.shields.io/badge/Firebase_Authentication-DD2C00?style=flat-square&logo=firebase&logoColor=white)

### Maps, Localization & Communication

![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=flat-square&logo=openstreetmap&logoColor=white)
![i18next](https://img.shields.io/badge/i18next-26A69A?style=flat-square&logo=i18next&logoColor=white)
![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=flat-square&logo=youtube&logoColor=white)
![Web3Forms](https://img.shields.io/badge/Web3Forms-Contact_Service-6C63FF?style=flat-square)

### Development & Deployment

![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)

## Security Architecture

Moji's Heritage does not rely on hiding frontend source code for security.

- Firebase Authentication handles administrator sign-in.
- Firebase custom claims enforce administrator authorization.
- Firestore security rules restrict content-management operations to authorised administrators.
- Public users can read published content.
- Public comments are created as unapproved and cannot approve themselves.
- Only administrators can approve, modify or delete submitted comments.
- Contact enquiries are handled separately through Web3Forms.
- `.env`, local Firebase administrator utilities and service-account credentials are excluded from Git.
- Sensitive service-account JSON files must never be committed to the repository.

> **Important:** Never commit `.env`, private keys, passwords, service-account JSON files or other credentials to GitHub.

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/abdulwahabbadmus001-creator/mojis-heritage.git
cd mojis-heritage
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and provide the required configuration values locally.

```bash
cp .env.example .env
```

Do not commit the resulting `.env` file.

### 4. Start development

```bash
npm run dev
```

### 5. Create a production build

```bash
npm run build
```

The current production build is generated in the `dist/` directory.

## Firestore Content Model

The application uses Firestore collections including:

```text
posts
listings
comments
siteSettings
analytics
```

Public access and administrative operations are governed by `firestore.rules`.

## Content Categories

Moji's Heritage supports cultural content including:

- Cultural Heritage
- Festivals
- Documentaries
- Short Histories
- Heroes & Heroines
- Traditional Foods
- Languages
- Photo Gallery

The platform is designed to grow as additional heritage stories, destinations and cultural resources are documented.

## Project Goal

Moji's Heritage aims to make Nigerian cultural knowledge more accessible, discoverable and useful to younger generations, researchers, travellers and anyone interested in the country's diverse heritage.

The project treats digital technology not simply as a publishing tool, but as infrastructure for documenting and presenting living cultural knowledge in an accessible form.

## Repository Safety

Before every push, check what Git is about to publish:

```bash
git status
```

The repository intentionally excludes local environment variables, dependencies, production build output and sensitive administrator utilities through `.gitignore`.

---

<div align="center">

### Moji's Heritage

**Culture • History • Discovery • Preservation**

Built with React, Firebase and modern web technologies.

</div>
