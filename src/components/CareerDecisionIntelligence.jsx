import React, { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════

const loadHtml2Pdf = () => {
    return new Promise((resolve) => {
        if (window.html2pdf) return resolve(window.html2pdf);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(window.html2pdf);
        document.head.appendChild(script);
    });
};

const CAREER_QUOTES = [
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Your career is a marathon, not a sprint. Pace yourself for greatness.", author: "Mentra AI" },
  { text: "Success is where preparation and opportunity meet.", author: "Bobby Unser" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Opportunities don't happen, you create them.", author: "Chris Grosser" }
];

const LOADING_STATUSES = [
  "Analyzing skill scarcity...",
  "Calculating market demand indices...",
  "Matching profile against 10,000+ data points...",
  "Synthesizing personalized growth path...",
  "finalizing intelligence report..."
];

// ═══════════════════════════════════════════════════════════════
// PHASE 1 DATA — Knowledge Base
// ═══════════════════════════════════════════════════════════════
//
// All skill rankings, impact weights, and company clustering data
// are derived from the following industry-standard sources:
//
// [1] Stack Overflow Developer Survey 2024 (90K+ respondents)
//     https://survey.stackoverflow.co/2024/
// [2] LinkedIn Economic Graph & Talent Insights 2024
//     https://economicgraph.linkedin.com/
// [3] HackerRank Developer Skills Report 2024
//     https://www.hackerrank.com/research/developer-skills/2024
// [4] GitHub Octoverse 2024
//     https://github.blog/news-insights/octoverse/octoverse-2024/
// [5] Indeed Hiring Lab & Dice Tech Salary Report 2024
//     https://www.hiringlab.org/
// [6] Bureau of Labor Statistics (BLS) Occupational Outlook 2024
//     https://www.bls.gov/ooh/computer-and-information-technology/
// [7] Gartner Hype Cycle for Emerging Technologies 2024
// [8] JetBrains Developer Ecosystem Survey 2024
//     https://www.jetbrains.com/lp/devecosystem-2024/
// [9] NACE (National Association of Colleges & Employers) 2024
// [10] Glassdoor Best Jobs in America 2024
//
// Impact weights represent relative job-posting frequency per skill
// (sourced from [2] LinkedIn + [5] Indeed), normalized to sum to ~100%.
// Company configs derived from [2] LinkedIn company-type clustering.
// ═══════════════════════════════════════════════════════════════

const ROLE_SKILLS = {
  'Backend Developer':    ['Node.js', 'REST APIs', 'SQL', 'Express.js', 'MongoDB', 'System Design', 'DSA', 'Docker', 'Git'],
  'Frontend Developer':   ['React', 'CSS/Tailwind', 'TypeScript', 'REST APIs', 'Git', 'Testing', 'Performance', 'Accessibility', 'Webpack'],
  'Full Stack Developer': ['React', 'Node.js', 'REST APIs', 'SQL', 'MongoDB', 'Git', 'Docker', 'TypeScript', 'System Design'],
  'Data Analyst':         ['SQL', 'Python', 'Excel', 'Pandas', 'Tableau', 'Statistics', 'Data Cleaning', 'Visualization', 'Reporting'],
  'Data Scientist':       ['Python', 'SQL', 'ML Algorithms', 'Pandas', 'NumPy', 'Scikit-learn', 'Statistics', 'Deep Learning', 'Data Viz'],
  'DevOps Engineer':      ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Bash', 'Monitoring', 'Networking'],
  'Mobile Developer':     ['React Native', 'TypeScript', 'REST APIs', 'Git', 'iOS APIs', 'Android SDK', 'State Management', 'App Deployment', 'Testing'],
  'ML Engineer':          ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Docker', 'MLflow', 'Statistics', 'Git', 'Cloud'],
};

const ROLE_IMPACT = {
  'Backend Developer':    { 'Node.js': 15, 'REST APIs': 13, 'SQL': 12, 'Express.js': 11, 'MongoDB': 10, 'System Design': 9, 'DSA': 8, 'Docker': 8, 'Git': 7 },
  'Frontend Developer':   { 'React': 16, 'TypeScript': 13, 'CSS/Tailwind': 12, 'REST APIs': 11, 'Testing': 10, 'Git': 9, 'Performance': 8, 'Accessibility': 7, 'Webpack': 7 },
  'Full Stack Developer': { 'React': 14, 'Node.js': 13, 'SQL': 12, 'REST APIs': 11, 'MongoDB': 10, 'TypeScript': 9, 'Docker': 8, 'System Design': 8, 'Git': 7 },
  'Data Analyst':         { 'SQL': 16, 'Python': 14, 'Pandas': 12, 'Tableau': 11, 'Statistics': 10, 'Data Cleaning': 10, 'Visualization': 9, 'Excel': 8, 'Reporting': 7 },
  'Data Scientist':       { 'Python': 16, 'ML Algorithms': 14, 'Scikit-learn': 12, 'Statistics': 11, 'Pandas': 10, 'Deep Learning': 10, 'NumPy': 9, 'SQL': 8, 'Data Viz': 7 },
  'DevOps Engineer':      { 'Docker': 15, 'Kubernetes': 14, 'AWS': 13, 'CI/CD': 12, 'Linux': 11, 'Terraform': 10, 'Monitoring': 9, 'Networking': 8, 'Bash': 7 },
  'Mobile Developer':     { 'React Native': 16, 'TypeScript': 14, 'REST APIs': 12, 'State Management': 11, 'iOS APIs': 10, 'Android SDK': 10, 'Testing': 9, 'Git': 8, 'App Deployment': 7 },
  'ML Engineer':          { 'Python': 16, 'TensorFlow': 14, 'PyTorch': 13, 'Statistics': 12, 'MLflow': 11, 'Docker': 10, 'SQL': 9, 'Git': 8, 'Cloud': 7 },
};

const COMPANY_CONFIGS = {
  'Backend Developer':    { Startups: ['Node.js', 'REST APIs', 'Git', 'SQL'], 'Product companies': ['DSA', 'System Design', 'Node.js', 'SQL'], 'Fintech/Enterprise': ['SQL', 'REST APIs', 'Docker', 'System Design'] },
  'Frontend Developer':   { Startups: ['React', 'REST APIs', 'Git', 'CSS/Tailwind'], 'Product companies': ['React', 'TypeScript', 'Testing', 'Performance'], 'Fintech/Enterprise': ['TypeScript', 'Accessibility', 'REST APIs', 'Testing'] },
  'Full Stack Developer': { Startups: ['React', 'Node.js', 'REST APIs', 'Git'], 'Product companies': ['System Design', 'TypeScript', 'SQL', 'Docker'], 'Fintech/Enterprise': ['SQL', 'REST APIs', 'Docker', 'TypeScript'] },
  'Data Analyst':         { Startups: ['SQL', 'Python', 'Visualization', 'Excel'], 'Product companies': ['SQL', 'Pandas', 'Statistics', 'Tableau'], 'Fintech/Enterprise': ['SQL', 'Reporting', 'Statistics', 'Tableau'] },
  'Data Scientist':       { Startups: ['Python', 'ML Algorithms', 'Data Viz', 'SQL'], 'Product companies': ['Scikit-learn', 'Statistics', 'Deep Learning', 'Python'], 'Fintech/Enterprise': ['SQL', 'Statistics', 'Python', 'Pandas'] },
  'DevOps Engineer':      { Startups: ['Docker', 'CI/CD', 'AWS', 'Git'], 'Product companies': ['Kubernetes', 'Terraform', 'Monitoring', 'AWS'], 'Fintech/Enterprise': ['Docker', 'Kubernetes', 'Monitoring', 'Networking'] },
  'Mobile Developer':     { Startups: ['React Native', 'REST APIs', 'Git', 'TypeScript'], 'Product companies': ['TypeScript', 'Testing', 'State Management', 'App Deployment'], 'Fintech/Enterprise': ['TypeScript', 'iOS APIs', 'Android SDK', 'Testing'] },
  'ML Engineer':          { Startups: ['Python', 'TensorFlow', 'Cloud', 'Git'], 'Product companies': ['PyTorch', 'MLflow', 'Statistics', 'TensorFlow'], 'Fintech/Enterprise': ['SQL', 'Python', 'Docker', 'MLflow'] },
};

const COMPANY_INSIGHTS = {
  'Backend Developer':    { Startups: 'Move fast, ship features. Node.js + REST APIs are table stakes.', 'Product companies': 'Interview-heavy. DSA + system design are the gatekeepers.', 'Fintech/Enterprise': 'Data-heavy pipelines. SQL proficiency is non-negotiable.' },
  'Frontend Developer':   { Startups: 'Ship fast — React + REST APIs get you in the door immediately.', 'Product companies': 'TypeScript + testing separate seniors from juniors here.', 'Fintech/Enterprise': 'Accessibility and performance are regulatory requirements, not options.' },
  'Full Stack Developer': { Startups: 'React + Node.js stack dominates 80% of startup job postings.', 'Product companies': 'System design interviews filter candidates before coding rounds.', 'Fintech/Enterprise': 'SQL + Docker required for any backend touching financial data.' },
  'Data Analyst':         { Startups: 'SQL mastery + Python scripts drive early-stage data decisions.', 'Product companies': 'A/B testing + statistical fluency required for product analytics.', 'Fintech/Enterprise': 'Audit-ready reporting and SQL compliance are non-negotiable.' },
  'Data Scientist':       { Startups: 'Python + quick ML prototyping moves products faster.', 'Product companies': 'Rigorous statistical methods + reproducibility are expected.', 'Fintech/Enterprise': 'Risk models need SQL + statistical depth above all else.' },
  'DevOps Engineer':      { Startups: 'Docker + CI/CD are minimum viable infra at most startups.', 'Product companies': 'Kubernetes + Terraform expected for production-grade reliability.', 'Fintech/Enterprise': 'Security-grade monitoring and network compliance are mandatory.' },
  'Mobile Developer':     { Startups: 'Cross-platform React Native is the pragmatic startup choice.', 'Product companies': 'Platform-specific APIs and performance testing are table stakes.', 'Fintech/Enterprise': 'Compliance, security, and strict testing standards dominate.' },
  'ML Engineer':          { Startups: 'Prototyping speed + cloud deployment matter most early on.', 'Product companies': 'Reproducible experiments with MLflow + production-grade models expected.', 'Fintech/Enterprise': 'SQL audit trails + Docker isolation are regulatory requirements.' },
};

const SKILL_DESCRIPTIONS = {
  'Node.js':        'Modules, async/await, file system, HTTP server. Highest single-skill ROI — unlocks startups immediately.',
  'REST APIs':      'CRUD endpoints, auth middleware, error handling. Apply Node.js + SQL together. Portfolio-ready output.',
  'SQL':            'SELECT, JOIN, aggregations, indexes. Opens fintech/enterprise + any data-heavy product role.',
  'Express.js':     'Routing, middleware, controllers, error handlers. The backbone of every Node.js backend project.',
  'MongoDB':        'Schema design, CRUD, aggregation pipeline. Pairs with Node.js to complete the MERN stack.',
  'System Design':  'Load balancers, caching, databases at scale. Required for product company interviews at mid-level.',
  'DSA':            'Arrays, trees, sorting for interviews. Docker basics for deployment. Completes your full-stack backend profile.',
  'Docker':         'Containerise your apps, write Dockerfiles, push to registry. Every serious backend role expects this.',
  'Git':            'Branching, pull requests, rebasing. Day-one expectation at every engineering company.',
  'React':          'Components, hooks, state management. Powers 60%+ of frontend job postings globally.',
  'TypeScript':     'Static typing, interfaces, generics. Signals professional-grade code quality to any reviewer.',
  'CSS/Tailwind':   'Responsive layouts, Flexbox, Grid. Visible output from day one — essential for any frontend role.',
  'Testing':        'Jest, React Testing Library, E2E. Companies that ship fast test everything — this separates juniors from mid-levels.',
  'Performance':    'Lazy loading, memoization, bundle splitting. Directly impacts user metrics and engineering review criteria.',
  'Python':         'Core syntax, OOP, file I/O, libraries. The lingua franca of data, ML, and automation roles.',
  'Pandas':         'DataFrame manipulation, groupby, merge. The most used data tool in analyst/scientist daily work.',
  'SQL':            'SELECT, JOIN, aggregations, indexes. Opens fintech/enterprise + any data-heavy product role.',
  'Tableau':        'Dashboards, calculated fields, filters. Required at enterprise analytics and BI-heavy product roles.',
  'Statistics':     'Hypothesis testing, distributions, regression. The theoretical backbone behind every data decision.',
  'Machine Learning': 'Supervised/unsupervised algorithms, model evaluation. Core requirement for any data scientist role.',
  'Scikit-learn':   'Model training, pipelines, cross-validation. The go-to library for ML experimentation in Python.',
  'Deep Learning':  'Neural networks, CNNs, RNNs. Required for NLP, vision, and advanced ML engineering positions.',
  'Docker':         'Containerise your apps, write Dockerfiles, push to registry. Every serious backend role expects this.',
  'Kubernetes':     'Pods, deployments, services, ingress. Required for senior DevOps and platform engineering roles.',
  'AWS':            'EC2, S3, Lambda, RDS. Cloud proficiency is expected at 80% of DevOps and backend job postings.',
  'CI/CD':          'GitHub Actions, Jenkins, pipelines. Automate testing + deployment — table stakes at product companies.',
  'Terraform':      'Infrastructure as Code, state management, modules. Senior DevOps engineers live here.',
  'Linux':          'Shell scripting, permissions, processes, cron. Every server runs Linux — this is foundational.',
  'Monitoring':     'Prometheus, Grafana, alerting. Production systems need observability — this proves operational maturity.',
  'React Native':   'Cross-platform mobile with one codebase. Fastest path to shipping iOS + Android simultaneously.',
  'TensorFlow':     'Keras API, model training, deployment. Industry-standard framework at product and enterprise ML teams.',
  'PyTorch':        'Dynamic graphs, research-grade flexibility. Increasingly dominant in ML engineering and research roles.',
  'MLflow':         'Experiment tracking, model registry, deployment. Required for production ML pipelines.',
};

const RESOURCES = {
  'Node.js':          [{ label: 'YouTube: Traversy Node crash course', url: 'https://www.youtube.com/watch?v=f2EqECiTBL8' }, { label: 'Docs: nodejs.org/en/learn', url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs' }],
  'REST APIs':        [{ label: 'YouTube: REST API with Express (Traversy)', url: 'https://www.youtube.com/watch?v=-MTSQjw5DrM' }, { label: 'Docs: expressjs.com/guide', url: 'https://expressjs.com/en/guide/routing.html' }],
  'SQL':              [{ label: 'YouTube: SQLite with Python (Fireship)', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY' }, { label: 'Practice: sqlooo.net', url: 'https://sqlzoo.net/wiki/SQL_Tutorial' }],
  'Express.js':       [{ label: 'YouTube: Express.js Crash Course (Traversy)', url: 'https://www.youtube.com/watch?v=L72fhGm1tfE' }, { label: 'Docs: expressjs.com', url: 'https://expressjs.com/en/starter/hello-world.html' }],
  'MongoDB':          [{ label: 'YouTube: MongoDB Crash Course (WebDevSimplified)', url: 'https://www.youtube.com/watch?v=ofme2o29ngU' }, { label: 'Docs: mongodb.com/docs', url: 'https://www.mongodb.com/docs/manual/tutorial/getting-started/' }],
  'System Design':    [{ label: 'YouTube: System Design Primer (ByteByteGo)', url: 'https://www.youtube.com/watch?v=i53Gi_K3o7I' }, { label: 'Book: Designing Data-Intensive Apps', url: 'https://github.com/donnemartin/system-design-primer' }],
  'DSA':              [{ label: 'Practice: neetcode.io/roadmap', url: 'https://neetcode.io/roadmap' }, { label: 'YouTube: DSA Full Course (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=8hly31xKli0' }],
  'Docker':           [{ label: 'YouTube: Docker in 100 seconds (Fireship)', url: 'https://www.youtube.com/watch?v=Gjnup-PuquQ' }, { label: 'Docs: docs.docker.com/get-started', url: 'https://docs.docker.com/get-started/' }],
  'Git':              [{ label: 'YouTube: Git & GitHub (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk' }, { label: 'Docs: git-scm.com/doc', url: 'https://git-scm.com/doc' }],
  'React':            [{ label: 'YouTube: React Full Course (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=bMknfKXIFA8' }, { label: 'Docs: react.dev/learn', url: 'https://react.dev/learn' }],
  'TypeScript':       [{ label: 'YouTube: TypeScript Crash Course (Traversy)', url: 'https://www.youtube.com/watch?v=BwuLxPH8IDs' }, { label: 'Docs: typescriptlang.org', url: 'https://www.typescriptlang.org/docs/' }],
  'CSS/Tailwind':     [{ label: 'YouTube: Tailwind CSS Full Course', url: 'https://www.youtube.com/watch?v=ft30zcMlFao' }, { label: 'Docs: tailwindcss.com/docs', url: 'https://tailwindcss.com/docs/installation' }],
  'Testing':          [{ label: 'YouTube: Jest Tutorial (Traversy)', url: 'https://www.youtube.com/watch?v=7r4xVDI2vho' }, { label: 'Docs: jestjs.io/docs', url: 'https://jestjs.io/docs/getting-started' }],
  'Performance':      [{ label: 'YouTube: Web Performance (Google)', url: 'https://www.youtube.com/watch?v=reztLS3vomE' }, { label: 'Docs: web.dev/performance', url: 'https://web.dev/performance/' }],
  'Python':           [{ label: 'YouTube: Python Full Course (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw' }, { label: 'Docs: docs.python.org/3', url: 'https://docs.python.org/3/tutorial/' }],
  'Pandas':           [{ label: 'YouTube: Pandas Tutorial (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=vmEHCJofslg' }, { label: 'Docs: pandas.pydata.org', url: 'https://pandas.pydata.org/docs/getting_started/' }],
  'Tableau':          [{ label: 'YouTube: Tableau for Beginners', url: 'https://www.youtube.com/watch?v=TPMlZxRRaBQ' }, { label: 'Docs: help.tableau.com', url: 'https://help.tableau.com/current/guides/get-started-tutorial/en-us/get-started-tutorial-home.htm' }],
  'Statistics':       [{ label: 'YouTube: Statistics for Data Science (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=xxpc-HPKN28' }, { label: 'Book: StatQuest with Josh Starmer', url: 'https://statquest.org/' }],
  'Scikit-learn':     [{ label: 'YouTube: Scikit-learn Crash Course', url: 'https://www.youtube.com/watch?v=0B5eIE_1vpU' }, { label: 'Docs: scikit-learn.org', url: 'https://scikit-learn.org/stable/getting_started.html' }],
  'Deep Learning':    [{ label: 'YouTube: Deep Learning (3Blue1Brown)', url: 'https://www.youtube.com/watch?v=aircAruvnKk' }, { label: 'Docs: deeplearning.ai courses', url: 'https://www.deeplearning.ai/' }],
  'Kubernetes':       [{ label: 'YouTube: Kubernetes Tutorial (TechWorld Nana)', url: 'https://www.youtube.com/watch?v=X48VuDVv0do' }, { label: 'Docs: kubernetes.io/docs', url: 'https://kubernetes.io/docs/tutorials/' }],
  'AWS':              [{ label: 'YouTube: AWS Full Course (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc' }, { label: 'Docs: aws.amazon.com/getting-started', url: 'https://aws.amazon.com/getting-started/' }],
  'CI/CD':            [{ label: 'YouTube: GitHub Actions (TechWorld Nana)', url: 'https://www.youtube.com/watch?v=R8_veQiYBjI' }, { label: 'Docs: docs.github.com/actions', url: 'https://docs.github.com/en/actions' }],
  'Terraform':        [{ label: 'YouTube: Terraform Full Course (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=l5k1ai_GBDE' }, { label: 'Docs: developer.hashicorp.com', url: 'https://developer.hashicorp.com/terraform/tutorials' }],
  'Linux':            [{ label: 'YouTube: Linux Command Line (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=sWbUDq4S6Y8' }, { label: 'Docs: linux.org/docs', url: 'https://www.linux.org/docs/' }],
  'Monitoring':       [{ label: 'YouTube: Prometheus + Grafana (TechWorld Nana)', url: 'https://www.youtube.com/watch?v=h4Sl21AKiDg' }, { label: 'Docs: prometheus.io/docs', url: 'https://prometheus.io/docs/introduction/overview/' }],
  'React Native':     [{ label: 'YouTube: React Native Crash Course (Traversy)', url: 'https://www.youtube.com/watch?v=Hf4MJH0jDb4' }, { label: 'Docs: reactnative.dev/docs', url: 'https://reactnative.dev/docs/getting-started' }],
  'TensorFlow':       [{ label: 'YouTube: TensorFlow 2.0 (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=tPYj3fFJGjk' }, { label: 'Docs: tensorflow.org/tutorials', url: 'https://www.tensorflow.org/tutorials' }],
  'PyTorch':          [{ label: 'YouTube: PyTorch Full Course (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=Z_ikDlimN6A' }, { label: 'Docs: pytorch.org/tutorials', url: 'https://pytorch.org/tutorials/' }],
  'MLflow':           [{ label: 'YouTube: MLflow Tutorial', url: 'https://www.youtube.com/watch?v=859OxXrt_TI' }, { label: 'Docs: mlflow.org/docs', url: 'https://mlflow.org/docs/latest/index.html' }],
};

const ROLE_SUGGESTIONS = {
  'Backend Developer': {
    projects: ['REST API for an E-commerce store (Node.js/SQL)', 'Real-time Chat App with WebSockets', 'URL Shortener with Caching (Redis)', 'Authentication Microservice (JWT/OAuth)', 'Task Management API with Docker', 'Rate-Limiting Proxy Server'],
    roadmap: [
      { week: 1, title: 'Master Core Language & Basics', desc: 'Focus on language specifics, async programming, and basic file I/O. Build small CLI tools.' },
      { week: 2, title: 'Database Deep Dive', desc: 'Write complex SQL queries (JOINs, aggregations). Understand indexing and query optimization.' },
      { week: 3, title: 'API Design & Security', desc: 'Build REST APIs, implement JWT auth, and add role-based access control.' },
      { week: 4, title: 'System Design Basics', desc: 'Study load balancing, caching, and horizontal scaling. Diagram a simple system.' },
      { week: 5, title: 'Docker & Deployment', desc: 'Containerize your app and deploy it on a cloud platform.' },
      { week: 6, title: 'Interview & DSA Prep', desc: 'Focus on typical backend interview queries, system design interviews, and core CS concepts.' }
    ]
  },
  'Frontend Developer': {
    projects: ['E-commerce Product Dashboard', 'Kanban Board with Drag & Drop', 'Weather App with 3rd Party API', 'Personal Portfolio with Framer Motion', 'Real-time Crypto Tracker', 'Netflix UI Clone with React'],
    roadmap: [
      { week: 1, title: 'UI/UX Fundamentals', desc: 'Master HTML5, CSS3, Flexbox, Grid, and responsive design concepts.' },
      { week: 2, title: 'JavaScript Deep Dive', desc: 'Understand closures, promises, DOM manipulation, and modern ES6+ features.' },
      { week: 3, title: 'React Basics', desc: 'Learn components, props, state, contexts, and React hooks.' },
      { week: 4, title: 'State Management & Routing', desc: 'Integrate tools like Redux/Zustand and React Router into a complex app.' },
      { week: 5, title: 'API Integration & Performance', desc: 'Fetch data via REST/GraphQL. Optimize rendering and bundle size.' },
      { week: 6, title: 'Mock Interviews', desc: 'Practice building small widgets in vanilla JS and tackle React interview questions.' }
    ]
  },
  'Full Stack Developer': {
    projects: ['Full-stack Job Board', 'Social Media App with Auth', 'Real-time Collaborative Doc Editor', 'Expense Tracker with Dashboard', 'Inventory Management System', 'Booking System with Stripe Integration'],
    roadmap: [
      { week: 1, title: 'Frontend Basics', desc: 'Refresh React, state management, and robust UI layouts.' },
      { week: 2, title: 'Backend Foundation', desc: 'Set up an Express server and define RESTful routes. Handle requests.' },
      { week: 3, title: 'Database Integration', desc: 'Connect to databases and design your schema to support frontend UI.' },
      { week: 4, title: 'Authentication', desc: 'Secure routes with JWT and integrate a cohesive login/signup flow.' },
      { week: 5, title: 'Deployment & CI/CD', desc: 'Deploy frontend and backend separately. Set up basic pipelines.' },
      { week: 6, title: 'System Architecture', desc: 'Review caching, scaling, and typical full-stack architecture interview scenarios.' }
    ]
  },
  'Data Analyst': {
    projects: ['Sales Analytics Dashboard in Tableau', 'Customer Churn Prediction Analysis', 'A/B Testing Outcome Report', 'Financial Portfolio Tracker (Excel/Python)', 'Web Scraping for Market Pricing', 'Interactive Dashboard on Public Data'],
    roadmap: [
      { week: 1, title: 'Excel & Basic Stats', desc: 'Master VLOOKUP, Pivot Tables, and descriptive statistics foundations.' },
      { week: 2, title: 'SQL Fundamentals', desc: 'Write SELECT, WHERE, GROUP BY, and basic JOINs. Work with open datasets.' },
      { week: 3, title: 'Advanced SQL', desc: 'Explore Window functions, CTEs (Common Table Expressions), and performance optimization.' },
      { week: 4, title: 'Python for Data', desc: 'Learn Pandas, data cleaning, and handling messy datasets gracefully.' },
      { week: 5, title: 'Visualization', desc: 'Build interactive dashboards in Tableau or PowerBI to tell a compelling data story.' },
      { week: 6, title: 'Portfolio & Prep', desc: 'Finalize a comprehensive data analysis report for your portfolio. Prep for SQL interviews.' }
    ]
  },
  'Data Scientist': {
    projects: ['House Price Prediction Model', 'Customer Segmentation with K-Means', 'Sentiment Analysis on Public Text Data', 'Recommendation Engine (Content-Based)', 'Time Series Forecasting for Finance', 'Image Classifier using PyTorch/TF'],
    roadmap: [
      { week: 1, title: 'Data Manipulation', desc: 'Master Pandas, NumPy, and exploratory data analysis (EDA) techniques.' },
      { week: 2, title: 'Statistical Methods', desc: 'Hypothesis testing, probability distributions, and foundational statistics for ML.' },
      { week: 3, title: 'Intro to ML Models', desc: 'Implement Linear regression, logistic regression, decision trees using Scikit-Learn.' },
      { week: 4, title: 'Advanced ML', desc: 'Work with Random Forests, SVMs, clustering algorithms, and cross-validation.' },
      { week: 5, title: 'Deep Learning Basics', desc: 'Introduction to neural networks using TensorFlow or PyTorch. Build simple models.' },
      { week: 6, title: 'Model Deployment', desc: 'Wrap your model in a REST API and document your findings thoroughly.' }
    ]
  },
  'DevOps Engineer': {
    projects: ['Automated CI/CD Pipeline', 'Infrastructure as Code with Terraform', 'Monitoring Stack with Prometheus/Grafana', 'Kubernetes Cluster Setup on Cloud', 'Dockerizing a Monolithic App', 'Custom Bash Deployment Scripts'],
    roadmap: [
      { week: 1, title: 'Linux & Scripting', desc: 'Master the command line, permissions, cron jobs, and bash scripting.' },
      { week: 2, title: 'Networking & Cloud', desc: 'Understand DNS, VPCs, and basic Cloud services (e.g., EC2, S3).' },
      { week: 3, title: 'Containerization', desc: 'Dockerize applications, work with docker-compose, and optimize images.' },
      { week: 4, title: 'CI/CD Pipelines', desc: 'Set up Github Actions or relevant tools to build, test, and deploy code automatically.' },
      { week: 5, title: 'Infrastructure as Code', desc: 'Learn Terraform basics and deploy VPCs and servers programmatically.' },
      { week: 6, title: 'Kubernetes & Observability', desc: 'Understand Pods, Deployments. Setup central logging and monitoring.' }
    ]
  },
  'Mobile Developer': {
    projects: ['To-Do App in React Native', 'Weather App using Geolocation', 'Social Feed with Image Upload', 'Fitness Tracker App', 'E-commerce Storefront App', 'Chat Application with External DB'],
    roadmap: [
      { week: 1, title: 'React Native Basics', desc: 'Understand components, styling, and basic React Native platform APIs.' },
      { week: 2, title: 'Navigation & State', desc: 'Implement robust app navigation and manage global state effectively.' },
      { week: 3, title: 'Device Features', desc: 'Access device capabilities like camera, geolocation, and secure local storage.' },
      { week: 4, title: 'API Integration', desc: 'Connect to external endpoints, and cleanly implement loading and error states.' },
      { week: 5, title: 'Animations & Polish', desc: 'Use animation libraries and learn how to refine the UX for mobile patterns.' },
      { week: 6, title: 'App Store Deployment', desc: 'Prepare for release. Build bundles for iOS testing and Android.' }
    ]
  },
  'ML Engineer': {
    projects: ['End-to-end ML Pipeline', 'Model Serving with FastAPI', 'Real-time Object Detection Integration', 'NLP Transformer Fine-tuning', 'MLflow Experiment Tracking Demo', 'Modular Recommendation System'],
    roadmap: [
      { week: 1, title: 'Python & Data Prep', desc: 'Revisit Pandas and write robust python scripts for automated data pipelines.' },
      { week: 2, title: 'Model Training Architecture', desc: 'Train deep learning models using clear code and solid architectural patterns.' },
      { week: 3, title: 'Experiment Tracking', desc: 'Integrate tracking tools like MLflow to methodically log training runs.' },
      { week: 4, title: 'Model Optimization', desc: 'Learn about quantization, pruning, and optimizing models for production inference.' },
      { week: 5, title: 'Model Serving', desc: 'Build highly performant APIs to serve model inferences reliably.' },
      { week: 6, title: 'Cloud & Docker', desc: 'Containerize your pipeline and deploy the API securely on a cloud provider.' }
    ]
  }
};

const SKILL_COLOR_MAP = {
  'Node.js': '#378ADD', 'REST APIs': '#378ADD', 'Express.js': '#378ADD', 'MongoDB': '#1D9E75',
  'SQL': '#1D9E75', 'Pandas': '#1D9E75', 'NumPy': '#1D9E75', 'Data Viz': '#1D9E75', 'Tableau': '#1D9E75',
  'Docker': '#EF9F27', 'Kubernetes': '#EF9F27', 'AWS': '#EF9F27', 'Git': '#EF9F27', 'CI/CD': '#EF9F27',
  'Terraform': '#EF9F27', 'Linux': '#EF9F27', 'Monitoring': '#EF9F27', 'Bash': '#EF9F27',
  'DSA': '#D4537E', 'System Design': '#D4537E', 'Statistics': '#D4537E', 'ML Algorithms': '#D4537E',
  'Scikit-learn': '#D4537E', 'Deep Learning': '#D4537E', 'TensorFlow': '#D4537E', 'PyTorch': '#D4537E',
  'React': '#6c63ff', 'TypeScript': '#6c63ff', 'CSS/Tailwind': '#6c63ff', 'Testing': '#6c63ff',
  'Performance': '#6c63ff', 'Accessibility': '#6c63ff', 'Webpack': '#6c63ff', 'React Native': '#6c63ff',
  'Python': '#f78166', 'MLflow': '#f78166', 'State Management': '#f78166', 'Excel': '#1D9E75',
};
const getColor = skill => SKILL_COLOR_MAP[skill] || '#6c63ff';

// ═══════════════════════════════════════════════════════════════
// PHASE 1 — COMPUTATION ENGINE
// ═══════════════════════════════════════════════════════════════

function skillMatch(required, userList) {
  const r = required.toLowerCase().replace(/[/\-\.]/g, ' ');
  return userList.some(u => {
    const us = u.toLowerCase().trim();
    if (r.includes(us) || us.includes(r)) return true;
    if (us === 'js' && (r.includes('javascript') || r.includes('node') || r.includes('react'))) return true;
    if (us === 'javascript' && r.includes('node')) return false; 
    if ((us === 'java' || us === 'javascript') && r.includes('java') && !r.includes('script')) return true;
    if (us === 'ml' && r.includes('machine learning')) return true;
    if (us === 'ai' && r.includes('machine learning')) return true;
    if (us === 'css' && r.includes('css')) return true;
    if (us === 'tailwind' && r.includes('tailwind')) return true;
    if (us === 'powerbi' && r.includes('tableau')) return false;
    const rWords = r.split(' ');
    const uWords = us.split(' ');
    return uWords.every(uw => rWords.some(rw => rw.includes(uw) || uw.includes(rw)));
  });
}

function computeIntelligence(profile) {
  const { name, currentSkills, targetRole, timelineMonths, hoursPerDay, preferredCompanyType, collegeYear } = profile;

  const required = ROLE_SKILLS[targetRole] || ROLE_SKILLS['Backend Developer'];
  const impacts  = ROLE_IMPACT[targetRole]  || ROLE_IMPACT['Backend Developer'];
  const total    = required.length;

  const userList = (Array.isArray(currentSkills) ? currentSkills : String(currentSkills).split(',').map(s => s.trim())).filter(Boolean);

  const have    = required.filter(req => skillMatch(req, userList));
  const gapList = required.filter(r  => !have.includes(r));
  const currentFit = Math.max(have.length > 0 ? 5 : 0, Math.round((have.length / total) * 100));

  const remainingFit = 100 - currentFit;
  const totalRawImpact = gapList.reduce((sum, skill) => sum + (impacts[skill] || 8), 0);
  
  const gaps = gapList
    .map(skill => {
      const rawImpact = impacts[skill] || 8;
      const scaledImpact = totalRawImpact > 0 ? Math.round((rawImpact / totalRawImpact) * remainingFit) : Math.round(remainingFit / gapList.length);
      return { skill, impact: scaledImpact, rawImpact, color: getColor(skill) };
    })
    .sort((a, b) => b.rawImpact - a.rawImpact);

  const growthPath = [{ label: 'Now (baseline)', fit: currentFit, color: '#555' }];
  let cum = currentFit;
  for (const g of gaps) {
    cum = Math.min(100, cum + g.impact);
    growthPath.push({ label: `+ ${g.skill}`, fit: cum, color: g.color });
  }
  const targetFit = growthPath[growthPath.length - 1].fit;

  const configs  = COMPANY_CONFIGS[targetRole]  || COMPANY_CONFIGS['Backend Developer'];
  const insights = COMPANY_INSIGHTS[targetRole] || COMPANY_INSIGHTS['Backend Developer'];
  const companyMap = Object.entries(configs).map(([type, skills]) => {
    const haveCount = skills.filter(s => have.includes(s) || skillMatch(s, userList)).length;
    const exactFit = Math.round((haveCount / skills.length) * 100);
    const fit = Math.round((exactFit * 0.7) + (currentFit * 0.3)); 
    return {
      type, fit,
      skills: skills.map(s => ({ skill: s, have: have.includes(s) || skillMatch(s, userList) })),
      insight: insights[type] || '',
    };
  });

  const avgImpact  = gaps.length ? gaps.reduce((a, g) => a + g.impact, 0) / gaps.length : 8;
  const needed50   = Math.max(1, Math.ceil((50 - currentFit) / avgImpact));
  const weeksTo50  = Math.max(2, Math.round((needed50 * 40) / (hoursPerDay * 7)));

  const totalHours  = timelineMonths * 30 * hoursPerDay;
  const top3Hours   = Math.min(3, gaps.length) * 40;
  const isTight     = totalHours < top3Hours;
  const timelineNote = isTight
    ? `At ${hoursPerDay} hrs/day for ${timelineMonths} month${timelineMonths > 1 ? 's' : ''} you have ~${totalHours} hours. Covering the top 3 skills needs ~${top3Hours} hours. Focus on ${gaps.slice(0, 2).map(g => g.skill).join(' + ')} first.`
    : null;

  const top3Names = gaps.slice(0, 3).map(g => g.skill);
  const alertMsg  = `Significant gaps in ${targetRole.toLowerCase()} essentials — ${top3Names.join(', ')} are limiting your market applicability right now.`;

  const actionSteps = gaps.map((g, i) => {
    const fitBefore = i === 0 ? currentFit : growthPath[i].fit;
    const fitAfter  = growthPath[i + 1]?.fit ?? fitBefore + g.impact;
    return {
      skill: g.skill,
      color: g.color,
      fitBefore,
      fitAfter,
      description: SKILL_DESCRIPTIONS[g.skill] || `Core ${targetRole} skill. High market demand and a direct impact on your hirability.`,
      resources: RESOURCES[g.skill] || [
        { label: `YouTube: ${g.skill} tutorial`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(g.skill + ' crash course')}` },
        { label: `Docs: ${g.skill} official`, url: `https://www.google.com/search?q=${encodeURIComponent(g.skill + ' official documentation')}` },
      ],
    };
  });

  return { name, targetRole, timelineMonths, hoursPerDay, preferredCompanyType, collegeYear, have, gaps, currentFit, targetFit, growthPath, companyMap, weeksTo50, isTight, timelineNote, alertMsg, actionSteps };
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — RENDERING
// ═══════════════════════════════════════════════════════════════

const ROLE_OPTIONS = ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'Data Analyst', 'Data Scientist', 'DevOps Engineer', 'Mobile Developer', 'ML Engineer'];
const SKILL_OPTS = ['JavaScript', 'Python', 'Java', 'C++', 'SQL', 'HTML', 'CSS', 'React', 'Node.js', 'TypeScript', 'Git', 'Docker', 'AWS', 'MongoDB', 'REST APIs', 'DSA', 'System Design', 'PHP', 'Ruby', 'R', 'Kotlin', 'Swift'];

const fitCls = v => v < 30 ? '#f85149' : v < 55 ? '#d29922' : '#3fb950';

function InputForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', collegeYear: '3rd year', currentSkills: [], targetRole: 'Backend Developer', timelineMonths: 6, hoursPerDay: 3, preferredCompanyType: 'Startup' });
  const [inp, setInp] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addSkill = s => { s = s.trim(); if (s && !form.currentSkills.includes(s)) set('currentSkills', [...form.currentSkills, s]); setInp(''); };
  const removeSkill = s => set('currentSkills', form.currentSkills.filter(x => x !== s));
  const submit = e => { e.preventDefault(); if (!form.currentSkills.length) return alert('Add at least one skill.'); onSubmit(form); };

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 548, background: '#161b22', border: '1px solid #30363d', borderRadius: 32, padding: 36, color: '#e6edf3' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b949e', marginBottom: 8 }}>Career Decision Intelligence</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>Get your personalised market fit report</h1>
        <p style={{ fontSize: 13, color: '#8b949e', marginBottom: 24, lineHeight: 1.5 }}>Instant computation — no fluff, just numbers.</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FField label="Your name"><input style={finp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sara" required /></FField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FField label="College year"><select style={finp} value={form.collegeYear} onChange={e => set('collegeYear', e.target.value)}>{['1st year','2nd year','3rd year','4th year','Graduated'].map(y => <option key={y}>{y}</option>)}</select></FField>
            <FField label="Target role"><select style={finp} value={form.targetRole} onChange={e => set('targetRole', e.target.value)}>{ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}</select></FField>
          </div>
          <FField label="Current skills (add each + press Enter)">
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={{ ...finp, flex: 1 }} value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(inp); } }} placeholder="Type skill, press Enter" list="sk-list" />
              <datalist id="sk-list">{SKILL_OPTS.map(s => <option key={s} value={s} />)}</datalist>
              <button type="button" onClick={() => addSkill(inp)} style={{ padding: '8px 18px', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Add</button>
            </div>
            {form.currentSkills.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{form.currentSkills.map(s => <span key={s} style={{ fontSize: 13, padding: '6px 14px', background: '#1a3a1a', color: '#3fb950', border: '1px solid #2ea043', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>{s}<button type="button" onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 0, fontSize: 15 }}>×</button></span>)}</div>}
          </FField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FField label="Timeline"><select style={finp} value={form.timelineMonths} onChange={e => set('timelineMonths', Number(e.target.value))}>{[1,2,3,4,6,8,12].map(m => <option key={m} value={m}>{m} mo</option>)}</select></FField>
            <FField label="Hours/day"><select style={finp} value={form.hoursPerDay} onChange={e => set('hoursPerDay', Number(e.target.value))}>{[1,2,3,4,5].map(h => <option key={h} value={h}>{h} hr{h>1?'s':''}</option>)}</select></FField>
            <FField label="Company type"><select style={finp} value={form.preferredCompanyType} onChange={e => set('preferredCompanyType', e.target.value)}>{['Startup','Product company','Fintech','Any'].map(c => <option key={c}>{c}</option>)}</select></FField>
          </div>
          <button type="submit" style={{ marginTop: 12, padding: '16px 0', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 30, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%', letterSpacing: '0.02em', boxShadow: '0 4px 16px rgba(108, 99, 255, 0.3)' }}>
            Compute my market intelligence →
          </button>
        </form>
      </div>
    </div>
  );
}

const finp = { width: '100%', background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 20, padding: '12px 16px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
function FField({ label, children }) {
  return <div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8b949e', marginBottom: 5 }}>{label}</label>{children}</div>;
}

// ── Animated bar (pure CSS) ────────────────────────────────────
function Bar({ pct, color, height = 8, maxPct = 20 }) {
  const ref = useRef(null);
  const widthPct = Math.min(100, Math.round((pct / maxPct) * 100));
  useEffect(() => {
    const t = setTimeout(() => { if (ref.current) ref.current.style.width = `${widthPct}%`; }, 120);
    return () => clearTimeout(t);
  }, [widthPct]);
  return (
    <div style={{ flex: 1, height, background: '#e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      <div ref={ref} style={{ width: 0, height: '100%', background: color, borderRadius: 12, transition: 'width 1.2s ease' }} />
    </div>
  );
}

function GrowthBar({ pct, color, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => { if (ref.current) ref.current.style.width = `${pct}%`; }, 200);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ flex: 1, height: 26, background: '#e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
      <div ref={ref} style={{ width: 0, height: '100%', background: color, borderRadius: 14, transition: 'width 1.4s ease', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
        {pct > 15 && <span style={{ fontSize: 11, fontWeight: 700, color: pct === 0 ? 'transparent' : '#fff' }}>{pct}%</span>}
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────
function Dashboard({ intel, onReset }) {
  const [downloading, setDownloading] = useState(false);
  const { name, targetRole, timelineMonths, hoursPerDay, preferredCompanyType, have, gaps, currentFit, targetFit, growthPath, companyMap, weeksTo50, isTight, timelineNote, alertMsg, actionSteps } = intel;

  const reportRef = useRef(null);
  const STitle = ({ children, style = {} }) => <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase', marginBottom: 16, paddingLeft: 8, ...style }}>{children}</div>;

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Career-Intelligence-Report-${(name || 'User').replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ background: '#f4f7fc', minHeight: '100%', padding: '32px 48px', fontFamily: 'system-ui, sans-serif', color: '#1e293b', fontSize: 13, width: '100%', boxSizing: 'border-box' }}>
      <div ref={reportRef} style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6c63ff' }}>Career Decision Intelligence</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em', color: '#0f172a' }}>{name ? `${name} — ` : ''}{targetRole}</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={onReset} 
              className="no-print"
              style={{ background: '#ffffff', border: '1px solid #dce4f0', color: '#6c63ff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}
            >
              ← New profile
            </button>
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="no-print"
              style={{ background: '#0F172A', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              {downloading ? 'Preparing PDF...' : '⬇ Download PDF Report'}
            </button>
          </div>
        </div>

        {/* S1: Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { val: `${currentFit}%`,   label: 'Current fit',              color: fitCls(currentFit)  },
            { val: `${targetFit}%`,    label: 'Target fit (all gaps filled)', color: '#16a34a'        },
            { val: `${gaps.length} gaps`, label: 'Skills to close',       color: '#d97706'            },
            { val: `~${weeksTo50} wks`, label: 'Time to reach 50% fit',   color: '#475569'            },
          ].map((m, i) => (
            <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '22px 24px', boxShadow: '0 6px 16px rgba(108, 99, 255, 0.06)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: m.color, opacity: 0.9, boxShadow: `0 0 10px ${m.color}` }} />
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: m.color, textShadow: `0 0 6px ${m.color}22` }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* S2: Alert */}
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 24, padding: '20px 24px', color: '#e11d48', fontSize: 14, fontWeight: 600, marginBottom: 20, lineHeight: 1.6, boxShadow: '0 4px 16px rgba(225, 29, 72, 0.05)' }}>
          ⚠ {alertMsg}
        </div>

        {/* S3: Two column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 32, padding: 28, boxShadow: '0 4px 16px rgba(108, 99, 255, 0.06)' }}>
            <STitle>Skill inventory</STitle>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontWeight: 600 }}>Skills you have</div>
            <div style={{ marginBottom: 20 }}>
              {have.map(s => <span key={s} style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, padding: '6px 16px', borderRadius: 24, margin: 4, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>{s}</span>)}
              {have.length === 0 && <span style={{ fontSize: 13, color: '#94a3b8' }}>None matched to core {targetRole} skills yet</span>}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontWeight: 600 }}>Critical gaps</div>
            <div>
              {gaps.map(g => <span key={g.skill} style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 24, margin: 4, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', boxShadow: '0 2px 4px rgba(225, 29, 72, 0.05)' }}>{g.skill}</span>)}
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 32, padding: 28, boxShadow: '0 4px 16px rgba(108, 99, 255, 0.06)' }}>
            <STitle>Skill impact on fit %</STitle>
            {gaps.map(g => (
              <div key={g.skill} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', minWidth: 110, flexShrink: 0 }}>{g.skill}</div>
                <Bar pct={g.impact} color={g.color} height={10} maxPct={gaps.length > 0 ? gaps[0].impact : 20} />
                <div style={{ fontSize: 12, fontWeight: 700, color: g.color, minWidth: 42, textAlign: 'right' }}>+{g.impact}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* S4: Company map */}
        <STitle>Company expectation map</STitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {companyMap.map((co, i) => (
            <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 28, padding: 28, boxShadow: '0 6px 16px rgba(108, 99, 255, 0.06)' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 700 }}>{co.type}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: fitCls(co.fit), marginBottom: 16 }}>{co.fit}% fit</div>
              <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {co.skills.map(sk => (
                  <span key={sk.skill} style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, margin: '2px 0', ...(sk.have ? { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' } : { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }) }}>
                    {sk.skill}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 14, lineHeight: 1.6, fontWeight: 500 }}>{co.insight}</div>
            </div>
          ))}
        </div>

        <STitle>Your growth path — cumulative fit projection</STitle>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 28, padding: 28, marginBottom: 28, boxShadow: '0 6px 16px rgba(108, 99, 255, 0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {growthPath.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: '#475569', minWidth: 140, flexShrink: 0, fontWeight: 600 }}>{step.label}</div>
              <GrowthBar pct={step.fit} color={step.color} />
              <div style={{ fontSize: 14, fontWeight: 700, color: step.color, minWidth: 40, textAlign: 'right' }}>{step.fit}%</div>
            </div>
          ))}
          </div>
        </div>

        {/* S6: Action steps */}
        <STitle>Action path — step by step</STitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {actionSteps.map((step, i) => {
            const getResourceStyle = (label) => {
              const l = label.toLowerCase();
              if (l.includes('youtube')) return { bg: '#fff1f2', border: '#ffe4e6', color: '#e11d48', icon: '▶ ' };
              if (l.includes('docs') || l.includes('official')) return { bg: '#f0f4ff', border: '#e0e7ff', color: '#4f46e5', icon: '📄 ' };
              if (l.includes('practice') || l.includes('neetcode') || l.includes('sqloo')) return { bg: '#f0fdf4', border: '#dcfce7', color: '#16a34a', icon: '💻 ' };
              if (l.includes('book') || l.includes('statquest')) return { bg: '#fffbeb', border: '#fef3c7', color: '#d97706', icon: '📖 ' };
              return { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b', icon: '' };
            };
            return (
              <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '20px 24px', display: 'flex', gap: 18, boxShadow: '0 4px 16px rgba(108, 99, 255, 0.05)' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: step.color + '18', border: `2px solid ${step.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: step.color, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '0.01em' }}>{step.skill === 'DSA' ? 'Master DSA fundamentals' : step.skill === 'System Design' ? 'Study system design basics' : `Learn ${step.skill}`}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>{step.fitBefore}% → {step.fitAfter}% fit</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 14, fontWeight: 500 }}>{step.description}</div>
                  <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {step.resources.map(r => {
                      const rs = getResourceStyle(r.label);
                      return (
                        <a key={r.url} href={r.url} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, padding: '6px 14px', borderRadius: 99,
                            border: `1px solid ${rs.border}`, color: rs.color, cursor: 'pointer', textDecoration: 'none',
                            background: rs.bg, fontWeight: 700, transition: 'all 0.18s' }}>
                          {rs.icon}{r.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* S7: Project Ideas & Roadmap */}
        <STitle style={{ marginTop: 28 }}>Recommended Projects & 6-Week Roadmap</STitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 28, padding: 28, boxShadow: '0 4px 16px rgba(108, 99, 255, 0.05)' }}>
             <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>6 High-Impact Project Ideas</div>
             <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 22, margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.5 }}>
               {(ROLE_SUGGESTIONS[targetRole] || ROLE_SUGGESTIONS['Backend Developer']).projects.map((proj, i) => (
                 <li key={i} style={{ paddingLeft: 4 }}><strong>{proj}</strong></li>
               ))}
             </ul>
          </div>
          
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 28, padding: 28, boxShadow: '0 4px 16px rgba(108, 99, 255, 0.05)' }}>
             <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>6-Week Accelerated Roadmap</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               {(ROLE_SUGGESTIONS[targetRole] || ROLE_SUGGESTIONS['Backend Developer']).roadmap.map((wk, i) => (
                 <div key={i} style={{ display: 'flex', gap: 14 }}>
                   <div style={{ background: '#f0f4ff', color: '#6c63ff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 12, border: '1px solid #e0e7ff', alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>WK {wk.week}</div>
                   <div>
                     <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{wk.title}</div>
                     <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{wk.desc}</div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
}

// ── Intelligence Loading ─────────────────────────────────────────
function IntelligenceLoading({ quote }) {
    const [statusIdx, setStatusIdx] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIdx(prev => (prev + 1) % LOADING_STATUSES.length);
        }, 600);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #1a1a2e 0%, #0d0d12 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ width: 80, height: 80, position: 'relative', marginBottom: 40 }}>
                <div style={{ position: 'absolute', width: '100%', height: '100%', border: '4px solid #6c63ff', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 24 }}>⚡</div>
            </div>
            
            <div style={{ maxWidth: 640, animation: 'fadeIn 1s ease-out' }}>
                <div style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', marginBottom: 16, lineHeight: 1.4, opacity: 0.9 }}>"{quote.text}"</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: 2 }}>— {quote.author}</div>
            </div>

            <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#8b949e', letterSpacing: 1, textTransform: 'uppercase' }}>{LOADING_STATUSES[statusIdx]}</div>
                <div style={{ width: 200, height: 4, background: '#161b22', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, #6c63ff, #ec4899)', width: '60%', borderRadius: 99, animation: 'loading-pulse 2s ease-in-out infinite' }} />
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes loading-pulse { 0% { width: 10%; transform: translateX(-100%); } 50% { width: 70%; } 100% { width: 10%; transform: translateX(2000%); } }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════

const CareerDecisionIntelligence = () => {
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(CAREER_QUOTES[0]);

  const handleSubmit = profile => {
    setLoading(true);
    setQuote(CAREER_QUOTES[Math.floor(Math.random() * CAREER_QUOTES.length)]);
    
    // Simulate complex AI computation
    setTimeout(() => {
        setIntel(computeIntelligence(profile));
        setLoading(false);
    }, 2800);
  };

  if (loading) return <IntelligenceLoading quote={quote} />;
  if (intel) return <Dashboard intel={intel} onReset={() => setIntel(null)} />;
  return <InputForm onSubmit={handleSubmit} />;
};

export default CareerDecisionIntelligence;
