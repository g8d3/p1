import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import TokenLaunchPage from "./pages/TokenLaunchPage";
import TokenExplorerPage from "./pages/TokenExplorerPage";
import TokenDetailsPage from "./pages/TokenDetailsPage";
import RevenueStatsPage from "./pages/RevenueStatsPage";
import CreatorRewardsPage from "./pages/CreatorRewardsPage";
import UserProfilePage from "./pages/UserProfilePage";
import InfoDocsPage from "./pages/InfoDocsPage";
import ThemeSwitcher from "./components/ThemeSwitcher";

function App() {
  return (
    <Router>
      <ThemeSwitcher />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/launch" element={<TokenLaunchPage />} />
        <Route path="/explorer" element={<TokenExplorerPage />} />
        <Route path="/token/:id" element={<TokenDetailsPage />} />
        <Route path="/revenue" element={<RevenueStatsPage />} />
        <Route path="/rewards" element={<CreatorRewardsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/info" element={<InfoDocsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
