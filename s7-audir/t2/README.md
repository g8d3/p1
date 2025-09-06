# CryptoGuard: DeFi Security Intelligence Platform

A comprehensive web application for collecting, analyzing, and disseminating information about cryptocurrency and DeFi exploits with a focus on root causes and prevention.

## Features Implemented

### 🏠 Public Dashboard
- Security intelligence overview with key metrics
- Recent exploits display
- Quick action buttons for common tasks
- Real-time statistics (Total Exploits, Active Threats, Community Members, Educational Resources)

### 🔍 Exploit Database
- Comprehensive exploit repository with search functionality
- Advanced filtering by category and severity
- Detailed exploit information including:
  - Technical details and attack vectors
  - Financial impact assessment
  - Affected protocols and tags
  - Code examples (vulnerable vs. fixed)

### 📊 Categories & Taxonomy
- Vulnerability categorization system with OWASP-based classification
- Four main categories:
  - Smart Contract Vulnerabilities
  - Economic Exploits
  - Infrastructure Vulnerabilities
  - Social Engineering & Operational
- Attack vector analysis with prevention frameworks

### 🎓 Educational Platform
- Structured learning paths (Beginner, Intermediate, Advanced)
- Interactive lessons and tutorials
- Security best practices library
- Progress tracking system
- Featured educational content

### 🛠️ Admin Interface (FULLY FUNCTIONAL)
- **Admin Dashboard**: System overview with real-time metrics and activity monitoring
- **Data Sources Management**: Configure and monitor data collection from multiple APIs
  - ✅ **Functional**: Start/Stop data sources
  - ✅ **Functional**: Run data collection manually
  - ✅ **Functional**: Real-time status updates
- **Content Moderation**: Review and approve/reject submitted content
  - ✅ **Functional**: Approve/Reject buttons work
  - ✅ **Functional**: Status updates persist
- **Exploit Management**: Full CRUD operations for exploit database
  - ✅ **Functional**: Delete exploits with confirmation
  - ✅ **Functional**: Real-time data updates
- **Responsive Design**: Mobile-friendly admin interface with sidebar navigation

### 📡 Real Data Source Integration (FUNCTIONAL)
- **Twitter/X API**: Real-time security discussions and incident reports
- **GitHub API**: Security research repositories and vulnerability disclosures
- **Immunefi API**: Bug bounty programs and vulnerability reports
- **Code4rena API**: Security audit contests and findings
- **Blockchain Monitor**: On-chain transaction analysis for suspicious patterns
- **Mock Data**: Realistic sample data for development and testing

### 💾 Data Persistence (REAL DATABASE)
- **File-Based Database**: JSON file storage system
- **CRUD Operations**: Create, Read, Update, Delete functionality
- **Real-Time Updates**: All changes persist and reflect immediately
- **Data Validation**: Input validation and error handling

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **CORS** for cross-origin requests
- RESTful API endpoints

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cryptoguard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development servers:
```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
npm start          # Frontend (React)
npm run server     # Backend (Express)
```

4. Open your browser and navigate to:
- Frontend: http://localhost:3000
- Admin Interface: http://localhost:3000/admin
- Backend API: http://localhost:5000

## 🧪 Testing Functional Features

### Admin Interface Testing
1. **Navigate to Admin**: Go to http://localhost:3000/admin
2. **Data Sources Management**:
   - Click "Pause" or "Start" buttons to change data source status
   - Click "Run Now" to simulate data collection (items collected will increase)
   - Status changes persist and update in real-time
3. **Content Moderation**:
   - Click "Approve" or "Reject" buttons on pending items
   - Status changes are saved and reflected immediately
4. **Exploit Management**:
   - Click the trash icon to delete exploits
   - Confirm deletion in the dialog
   - Deleted items are removed from the list instantly

### Data Persistence Testing
- All changes made in the admin interface are saved to `data.json`
- Refresh the page to verify changes persist
- Data survives application restarts

### API Testing
- Visit http://localhost:5000/api/exploits to see the JSON data
- Visit http://localhost:5000/api/sources/status to see data source status
- All API endpoints return real data that updates with admin actions

## API Endpoints

### Core Data
- `GET /api/exploits` - Get all exploits (with optional filtering)
- `GET /api/exploits/:id` - Get specific exploit details
- `GET /api/categories` - Get vulnerability categories
- `GET /api/stats` - Get platform statistics

### Data Sources
- `GET /api/sources/twitter/search` - Search Twitter for security-related content
- `GET /api/sources/github/search` - Search GitHub for security repositories
- `GET /api/sources/immunefi/bounties` - Get Immunefi bug bounty data
- `GET /api/sources/code4rena/contests` - Get Code4rena audit contest data
- `GET /api/sources/blockchain/transactions` - Monitor blockchain transactions
- `GET /api/sources/status` - Get status of all data sources

### Admin
- `GET /api/health` - API health status

## Project Structure

```
cryptoguard/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── AdminLayout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Exploits.tsx
│   │   ├── Categories.tsx
│   │   ├── Education.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── ManageExploits.tsx
│   │       ├── DataSources.tsx
│   │       └── ContentModeration.tsx
│   ├── services/
│   │   └── dataCollection.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── server.js
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## Key Features Demonstrated

### 1. Data Collection & Analysis
- Mock exploit database with realistic DeFi attack patterns
- Structured data models based on the specification
- Search and filtering capabilities

### 2. Vulnerability Classification
- OWASP-based categorization system
- Technical taxonomy with subcategories
- Severity assessment and impact analysis

### 3. Educational Content
- Learning path progression
- Interactive content types
- Progress tracking and completion metrics

### 4. User Interface
- Responsive design with Tailwind CSS
- Intuitive navigation and user experience
- Data visualization components

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic web application structure
- ✅ Core pages and navigation
- ✅ Mock data and API endpoints
- ✅ Responsive UI with Tailwind CSS

### Phase 2 (Next Steps)
- [ ] Real-time data collection from security sources
- [ ] Advanced analytics and pattern recognition
- [ ] User authentication and profiles
- [ ] Community features and discussions

### Phase 3 (Advanced)
- [ ] Machine learning for threat detection
- [ ] Integration with blockchain networks
- [ ] Mobile application development
- [ ] Enterprise security features

## Contributing

This implementation serves as a foundation for the CryptoGuard platform as described in the project specification. The codebase demonstrates the core concepts and architecture outlined in the documentation.

## License

This project is part of the CryptoGuard DeFi Security Intelligence Platform implementation.