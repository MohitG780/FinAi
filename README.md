<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/120px-Python-logo-notext.svg.png" alt="Logo" width="80" height="auto" style="display: none;"/>
  <h1>FinAI — AI Financial Analyst</h1>
  <p>A modern, interactive, and beautifully designed web application for AI-driven financial insights, stock tracking, and document sentiment analysis.</p>
</div>

---

## 📸 Screenshots

| Sign In & Registration | Real-Time Dashboard |
| :---: | :---: |
| <img src="assets/login.png" width="400" alt="Sign In Screen"> | <img src="assets/dashboard.png" width="400" alt="Main Dashboard"> |

| Deep Insights & Sentiment | Real-Time Market Reports |
| :---: | :---: |
| <img src="assets/insights.png" width="400" alt="Insights View"> | <img src="assets/reports.png" width="400" alt="Reports View"> |


## ✨ Features

- **Secure Authentication:** Firebase Email/Password authentication with automatic Gravatar profile integration.
- **Dynamic Real-Time Data:** Live stock price tickers, market indices (NIFTY, SENSEX), and company sector performance powered by real-time JavaScript event loops.
- **AI Analysis Engine Simulation:** Stunning step-by-step progress UI depicting FinBERT NLP tokenization, risk extraction, and sentiment scoring.
- **Light & Dark Mode:** Completely responsive, theme-switchable UI with glassmorphic accents, particle backgrounds, and modern micro-animations.
- **Data Persistence:** Automatic seeding of market analyses directly to a secure Firebase Firestore database.
- **Secure Deployment:** Built-in GitHub Actions CI/CD to prevent API key leaks and auto-deploy to GitHub Pages.

## 🛠 Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES modules)
- **Backend/BaaS:** Firebase Authentication & Cloud Firestore (v10.12 Web SDK)
- **Icons & APIs:** Gravatar Web API, inline custom SVGs
- **Deployment:** GitHub Pages & GitHub Actions Secrets

## 🚀 Setting Up Locally

If you want to run this application on your local machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MohitG780/FinAi.git
   cd FinAi
   ```

2. **Create your Firebase Config:**
   Copy the example template and fill in your Firebase API keys.
   ```bash
   cp js/firebase-config.example.js js/firebase-config.js
   ```
   *Note:* Replace the placeholder variables inside `js/firebase-config.js` with your active Firebase project settings. Make sure **Email/Password** Auth and **Firestore Database** are enabled in your console.

3. **Serve the Application:**
   Because the app uses ES Modules (`<script type="module">`), you must serve it over HTTP:
   ```bash
   npx serve .
   ```
   *Navigate to `http://localhost:3000` to start analyzing!*

## 🌐 Deployment (GitHub Pages)

This project runs a CI/CD GitHub Actions Workflow to keep your Firebase keys entirely safe from the git history.

1. Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Add the following repository secrets provided by your Firebase Project:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`
3. Push to the `main` branch. GitHub Actions will auto-inject the keys into the built code and automatically deploy the application to your `gh-pages` branch.

## 🛡️ Security Note

The real `firebase-config.js` containing API keys is added to `.gitignore`. Never commit your real API keys directly to the public repository. Use the automated deployment pipeline provided to handle secrets securely!
