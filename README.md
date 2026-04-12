# Mentra.AI : Advanced Career Intelligence Platform 🚀

Mentra.AI is a data-driven career coaching platform designed to rescue students and early-career developers from "tutorial hell". By harnessing high-quality industry standards and advanced AI, Mentra.AI generates hyper-personalized roadmaps, dynamic learning missions, interactive mock interviews, and objective resume analysis.

---

## 🌟 Key Features

### 1. **Hyper-Personalized Learning Roadmaps** 🗺️
Dynamic roadmaps engineered specifically for you. The engine calibrates to your target role, academic year, daily availability, and automatically computes an **Experience Tier** (Beginner, Intermediate, Advanced) based on your self-reported skills. 
- *Beginners* receive guided tutorials and foundational tasks.
- *Advanced* learners bypass basic concepts and are challenged with system internals, architecture logic, and production-grade optimization edge-cases.

### 2. **Bloom's Taxonomy Daily Missions** 🎯
Your broad weekly roadmap is broken down into concise, actionable daily missions adhering to a Learn → Practice → Build approach.
- **Learn:** Documentation and conceptual study.
- **Practice:** Hands-on patterns in LeetCode/HackerRank style.
- **Build:** Actual integrations and feature builds to grow your proof of work.

### 3. **Intelligent Mock Interviews** 🗣️
Perform personalized technical or behavioral mock interviews. Questions adjust seamlessly in difficulty based on known skill gaps and your experience tier. You get evaluated iteratively with an automated score feedback loop updating your global readiness confidence score.

### 4. **Industry-Standard Resume Reviewer** 📄
Resume analysis grounded in proven industry benchmarks (Google's XYZ formula, Jobscan ATS research, Harvard OCS structure standards, and NACE guidelines). Actionable metrics outline exact strengths alongside highlighted "weak bullet points" needing repair.

### 5. **Market Signal Intelligence** 📈
Leverages insights derived from massive developers surveys like Stack Overflow, LinkedIn Economic Graph, BLS, and GitHub Octoverse. Expect career coaching that focuses heavily on "Market Arbitrage" — identifying and teaching high-demand, low-supply skills.

---

## 🛠️ Tech Stack

### Frontend
- **React.js** (built with Vite)
- **TailwindCSS** (for fast, aesthetic, utility-first styling)
- **Framer Motion** (for fluid animations and step transitions)
- **React-Router** 

### Backend
- **Node.js + Express** (RESTful architecture)
- **MongoDB + Mongoose** (Data models: Users, Gap Reports, Daily Trackers)
- **AI Agent Engine** (Gemini 2.0 / Llama via OpenRouter with explicitly calibrated prompt engineering logic)

---

## 🚀 Running the Project Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/en) installed.
- Access to a MongoDB cluster (e.g., MongoDB Atlas).
- An API Key from OpenRouter. 

### 2. Install Dependencies
In the root directory for the frontend:
\`\`\`bash
npm install
\`\`\`

In the \`server\` directory for the backend:
\`\`\`bash
cd server
npm install
\`\`\`

### 3. Environment Setup
Create a \`.env\` file in the \`server\` directory:
\`\`\`env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENROUTER_API_KEY=your_openrouter_api_key
\`\`\`

### 4. Start the Application
Start the backend (from the \`server\` directory):
\`\`\`bash
node index.js
\`\`\`

Start the frontend (from the root directory):
\`\`\`bash
npm run dev
\`\`\`

Your app should now be running at \`http://localhost:5173\` and connected to the backend API at \`http://localhost:5000\`.

---

## 📝 Design Philosophy
Mentra.AI was built to solve the frustration of generic AI advice. The entire backend prompt-engineering pipeline is injected with explicit constraints that enforce "market arbitrage", "production patterns", and strictly avert generic outputs like "Go watch a React tutorial". It expects proof of work from the user and enforces it throughout the onboarding-to-dashboard workflow.
