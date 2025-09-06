import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Exploits from './pages/Exploits';
import Categories from './pages/Categories';
import Education from './pages/Education';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageExploits from './pages/admin/ManageExploits';
import DataSources from './pages/admin/DataSources';
import ContentModeration from './pages/admin/ContentModeration';
import './App.css';

// Layout component for public pages
const PublicLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main className="container mx-auto px-4 py-8">
      <Outlet />
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="exploits" element={<Exploits />} />
          <Route path="categories" element={<Categories />} />
          <Route path="education" element={<Education />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="exploits" element={<ManageExploits />} />
          <Route path="sources" element={<DataSources />} />
          <Route path="moderation" element={<ContentModeration />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;