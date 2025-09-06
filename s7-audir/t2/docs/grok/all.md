# Overview.md

## Project Overview

### Project Name
Crypto Exploit Analyzer

### Description
This web application scrapes publicly available web data on cryptocurrency exploits, with a primary focus on the root causes of vulnerabilities rather than the financial amounts involved. The goal is to educate developers, users, and stakeholders in the blockchain ecosystem on how to build and use secure decentralized applications (dApps). By aggregating and analyzing exploit data, including details on auditors involved, the app aims to foster better security practices. In future iterations, it could evolve into a proactive security tool, such as an AI-driven vulnerability scanner or advisory system that uses historical data to prevent similar exploits in new dApps.

### Target Audience
- dApp developers seeking to learn from past mistakes.
- Security researchers analyzing patterns in exploits.
- Blockchain enthusiasts and users interested in dApp safety.
- Auditors and consultants in the crypto space.

### Key Objectives
- Collect and curate data on crypto exploits from reliable sources (e.g., security blogs, GitHub repos, news sites), including auditor information.
- Emphasize causes (e.g., reentrancy attacks, integer overflows) over impacts (e.g., stolen funds).
- Provide educational resources, such as prevention guides and code snippets.
- Enable community contributions to keep data up-to-date.
- Lay the foundation for advanced features like automated security checks.

### Scope
- Phase 1: Data scraping, storage, and basic web interface for browsing exploits.
- Phase 2: Advanced search, analytics, and educational content.
- Phase 3: Integration with security tools (e.g., API for dApp scanning).

### Assumptions and Constraints
- Scraping will adhere to legal and ethical guidelines (e.g., respect robots.txt, rate limiting).
- Data sources must be public and non-proprietary.
- Focus on open-source blockchain platforms like Ethereum, Solana, etc.
- No real-time trading or financial advice; purely educational.

### Tech Stack (High-Level)
- Frontend: React.js with Tailwind CSS for responsive UI.
- Backend: Node.js with Express.js.
- Scraper: Python with Scrapy or BeautifulSoup.
- Database: PostgreSQL for robust relational storage; SQLite as an alternative for lightweight deployments.
- Deployment: Docker for containerization, hosted on AWS or Vercel.


# Features.md

## Core Features

### Data Scraping and Ingestion
- Automated scraper that runs periodically (e.g., daily via cron job) to fetch exploit data from sources like:
  - Rekt.news, DeFiLlama, or security-focused blogs.
  - GitHub issues from blockchain projects.
  - Public reports from firms like PeckShield or Certik.
- Focus on extracting: Exploit date, affected protocol, cause, auditors involved (e.g., auditing firm or individual), technical details, and links to sources.
- Avoid scraping sensitive or paywalled content; use APIs where available (e.g., RSS feeds).

### Exploit Database
- Searchable list of exploits, filterable by:
  - Cause category (e.g., reentrancy, flash loan manipulation, oracle issues).
  - Blockchain network (e.g., Ethereum, BSC).
  - Auditor (e.g., Certik, OpenZeppelin).
  - Date range.
- Detail view for each exploit: Description, cause breakdown, auditors involved, affected code snippets (anonymized), and prevention tips.

### Educational Resources
- Cause-specific guides: E.g., "How to Prevent Reentrancy Attacks" with code examples in Solidity.
- Interactive quizzes or simulations to test knowledge on common vulnerabilities.
- Blog section for user-submitted articles on security best practices.

### User Interaction
- User accounts for favoriting exploits or contributing data.
- Community forum or comment system for discussions.
- Export data as CSV/JSON for researchers.

### Analytics Dashboard
- Visualize trends: E.g., pie chart of exploit causes over time.
- Pattern recognition: Highlight recurring issues in specific ecosystems or by specific auditors.

### Future Enhancements
- API endpoint for integrating with dApp development tools (e.g., query for similar vulnerabilities).
- AI-powered recommendations: Analyze user-submitted smart contract code against historical exploits.
- Alerts system: Notify users of new exploits matching their interests.

## Non-Functional Requirements
- Performance: Handle up to 1,000 concurrent users; optimize database queries.
- Security: Use HTTPS, JWT for auth; sanitize scraped data to prevent XSS.
- Accessibility: WCAG-compliant UI.
- Scalability: Design for easy addition of new data sources.

# Architecture.md

## High-Level Architecture

### System Components
1. **Scraper Module** (Python-based):
   - Uses libraries like Requests and BeautifulSoup/Scrapy.
   - Scheduled via Celery or cron.
   - Outputs JSON data to a queue (e.g., RabbitMQ) for backend processing.

2. **Backend Server** (Node.js/Express):
   - API endpoints: `/exploits`, `/search`, `/causes`, `/auditors`, etc.
   - Handles data validation, storage, and user auth (using Passport.js).
   - Integrates with database and scraper output.

3. **Database** (PostgreSQL, SQLite alternative):
   - PostgreSQL: Relational database with tables for `exploits`, `auditors`, `users`, `guides`.
   - SQLite: For smaller deployments, using the same schema but with file-based storage.
   - Indexing on cause, auditor, and date for fast queries.

4. **Frontend** (React.js):
   - Components: Navbar, SearchBar, ExploitCard, DetailModal.
   - State management with Redux or Context API.
   - Charts via Chart.js for analytics.

5. **Deployment Pipeline**:
   - CI/CD with GitHub Actions.
   - Containers: Docker for scraper, backend, and frontend.
   - Monitoring: Prometheus for metrics, Sentry for errors.

### Data Flow
1. Scraper fetches data → Parses → Sends to backend queue.
2. Backend processes and stores in DB.
3. Frontend queries backend API → Renders data.
4. User interactions (e.g., search) trigger API calls.

### Security Considerations
- Scraper: Use proxies if needed to avoid bans; comply with terms of service.
- Backend: Rate limiting with express-rate-limit.
- Data: Anonymize any personal info; focus on technical causes and auditor details.

### Scalability
- Horizontal scaling for backend.
- Caching with Redis for frequent queries.


# UI-Design.md

## UI Design Principles
- Clean, modern interface with dark mode for crypto theme.
- Responsive: Mobile-first design.
- Intuitive navigation: Focus on search and browse.
- Visuals: Icons for cause categories (e.g., lock for security bugs).

## Key Pages

### Home Page
- Hero section: "Learn from Crypto Exploits to Build Secure dApps"
- Search bar with filters.
- Featured exploits carousel.
- Stats: "X exploits analyzed, Y common causes."

### Exploits List Page
- Grid or list view of Exploit Cards.
- Each card: Title (e.g., "Protocol X Reentrancy Exploit"), Date, Cause Tag, Auditor(s), Brief Description.
- Pagination and infinite scroll.

### Exploit Detail Page
- Header: Exploit name, date, affected chain, auditor(s).
- Sections:
  - Cause Analysis: Detailed breakdown with code snippets (using Prism.js for highlighting).
  - Timeline: Steps of the exploit.
  - Auditors: List of firms/individuals involved in analysis (e.g., Certik, OpenZeppelin).
  - Prevention: Bullet points with best practices.
  - Sources: Links to original reports.
- Related exploits sidebar.

### Guides Page
- Accordion or tabs for different cause categories.
- Content: Markdown-rendered articles with examples.

### Dashboard (Logged-in Users)
- Personalized feeds: Recent exploits by followed causes or auditors.
- Analytics charts: Bar graph of exploits by cause or auditor.

## Wireframes (Text-Based Descriptions)
- **Home Wireframe**:
  ```
  [Navbar: Logo | Search | Login]
  [Hero: Title + CTA Button]
  [Filters: Dropdowns for Cause/Chain/Auditor]
  [Grid: Exploit Card 1 | Card 2 | ...]
  [Footer: About | Contact]
  ```

- **Detail Wireframe**:
  ```
  [Back Button]
  [Header: Exploit Info | Auditors]
  [Tabs: Overview | Cause | Auditors | Prevention]
  [Sidebar: Related | Comments]
  ```

## Tools for Prototyping
- Use Figma or Sketch for actual wireframes.
- CSS Framework: Tailwind for rapid styling.

# Data-Model.md

## Data Structures

### Exploit Table (PostgreSQL/SQLite)
```sql
CREATE TABLE exploits (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  protocol VARCHAR(255) NOT NULL, -- e.g., "Uniswap V2"
  chain VARCHAR(100), -- e.g., "Ethereum"
  cause VARCHAR(100), -- e.g., "Reentrancy"
  sub_causes TEXT[], -- e.g., ["Unchecked External Call"]
  description TEXT,
  technical_details TEXT, -- Markdown with code
  sources JSONB, -- e.g., [{ "url": "https://...", "title": "Report" }]
  auditors JSONB, -- e.g., [{ "name": "Certik", "url": "https://..." }]
  prevention_tips TEXT[]
);
```

### Auditors Table
```sql
CREATE TABLE auditors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL, -- e.g., "Certik"
  url VARCHAR(255), -- Optional link to auditor's site
  UNIQUE(name)
);
```

### Exploit-Auditor Mapping (Many-to-Many)
```sql
CREATE TABLE exploit_auditors (
  exploit_id INTEGER REFERENCES exploits(id),
  auditor_id INTEGER REFERENCES auditors(id),
  PRIMARY KEY (exploit_id, auditor_id)
);
```

### User Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  favorites INTEGER[], -- Array of exploit IDs
  followed_causes TEXT[], -- e.g., ["Reentrancy"]
  followed_auditors INTEGER[] -- Array of auditor IDs
);
```

### Guide Table
```sql
CREATE TABLE guides (
  id SERIAL PRIMARY KEY,
  cause VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT, -- Markdown
  examples JSONB -- e.g., [{ "language": "Solidity", "code": "..." }]
);
```

## Data Sources for Scraping
- URLs: List maintained in config (e.g., ["https://rekt.news/", "https://defillama.com/hacks"]).
- Parsing Rules: XPath or CSS selectors for extracting fields (e.g., date from .date-class, auditors from report metadata).

## Data Integrity
- Validation: Ensure cause is categorized correctly; use regex or NLP for auto-tagging auditors.
- Updates: Use versioning (e.g., update `exploits` table with new data) if new info or auditors emerge.
- Indexes: Create indexes on `exploits.cause`, `exploits.date`, and `exploit_auditors.auditor_id` for fast queries.

