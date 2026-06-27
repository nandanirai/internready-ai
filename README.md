# InternReady AI – AI-Powered Internship Tracking & Preparation Copilot

InternReady AI is a full-stack AI-powered internship tracking and preparation platform built to help track for research internships, corporate internships, and fellowship opportunities.

Built using **Google AI Studio**, **Gemini 2.5 Flash**, **React**, **Node.js**, **Express.js**, **Firebase**, and **Google Cloud Run**, the application transforms internship discovery into an intelligent, action-oriented workflow by combining AI-powered opportunity scanning, document readiness analysis, personalized preparation plans, and deadline management.

---
## 🌐 Live Demo

**Application:** https://internready-ai-355857144148.asia-southeast1.run.app

## 🚀 Features

🔍 AI Opportunity Scanner
Search internship opportunities using keywords or official internship URLs.
Uses Gemini 2.5 Flash to extract structured internship information from official webpages.
Presents internship details including deadline, duration, stipend, eligibility, and required documents.

📄 Internship Dashboard
Browse tracked internship opportunities.
View application status such as Open, Rolling, Upcoming, or Closed.
Filter and organize opportunities for easier tracking.

📑 Document Readiness
Maintain a checklist of commonly required application documents including Resume, SOP, Transcript, Letter of Recommendation, and Portfolio.
Compare available documents against internship requirements.

🤖 AI Preparation Copilot
Generate an AI-assisted preparation plan for selected internship opportunities.
Receive suggested preparation steps based on internship requirements and deadlines.

☁️ Cloud-Native Deployment
Built using Google AI Studio.
Powered by Gemini 2.5 Flash.
Uses Firebase Authentication and Cloud Firestore.
Deployed on Google Cloud Run.
---

# 🏗️ Architecture

```text
                     User
                      │
                      ▼
          React + Vite Frontend
                      │
                      ▼
           Express.js Backend API
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
 Gemini 2.5 Flash API        Firebase Firestore
        │                           │
        └─────────────┬─────────────┘
                      ▼
              Google Cloud Run
```

---

# 🛠️ Technology Stack

| Layer          | Technology                                |
| -------------- | ----------------------------------------- |
| Frontend       | React, TypeScript, Vite, Tailwind CSS     |
| Backend        | Node.js, Express.js                       |
| AI             | Google Gemini 2.5 Flash (`@google/genai`) |
| Database       | Firebase Firestore                        |
| Authentication | Firebase Authentication                   |
| Deployment     | Google Cloud Run                          |
| Language       | TypeScript                                |

---

# ⚙️ Local Development

## Prerequisites

* Node.js (v18 or later)
* Google AI Studio API Key
* Firebase Project

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root (refer to `.env.example`):

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
APP_URL=http://localhost:3000
```

> **Important:** Never commit your `.env` file or API keys to GitHub.

---

## Run Development Server

```bash
npm run dev
```

The application will be available at:

```
http://localhost:3000
```

---

# 🚢 Production Build

Build the frontend and backend:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

---

# ☁️ Deploy to Google Cloud Run

```bash
gcloud run deploy internready-ai \
  --source . \
  --port 3000 \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

# 🔒 Firestore Security Rules

For authenticated access, configure Firestore rules similar to:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
}
```

Adjust these rules according to your application's security requirements.

---


```

---

# 🚀 Future Enhancements

* Automatic monitoring of recurring internship programs
* Scheduled background verification of official internship portals
* Email and push notifications for opening and closing deadlines
* AI-powered resume and SOP optimization
* Personalized internship recommendations based on student profiles

---

# 👩‍💻 Developer

Developed as part of the **Google Cloud AI Hackathon** using Google AI Studio and Google Cloud Platform.

