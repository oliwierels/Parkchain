import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SolanaWalletProvider } from './context/SolanaWalletContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import AddParkingPage from './pages/AddParkingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MyReservationsPage from './pages/MyReservationsPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import ChargingDashboardPage from './pages/ChargingDashboardPage';
import ChargingMapPage from './pages/ChargingMapPage';
import AddChargingStationPage from './pages/AddChargingStationPage';
import LiveFeedPage from './pages/LiveFeedPage';
import PointsMarketplacePage from './pages/PointsMarketplacePage';
import BadgesPage from './pages/BadgesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import GatewayDashboardPage from './pages/GatewayDashboardPage';
import AdvancedGatewayDashboard from './pages/AdvancedGatewayDashboard';
import AchievementsPage from './pages/AchievementsPage';
import GatewayShowcase from './components/GatewayShowcase';
import ParkingMarketplacePage from './pages/ParkingMarketplacePage';
import InstitutionalOperatorDashboard from './pages/InstitutionalOperatorDashboard';
import FavoritesPage from './pages/FavoritesPage';
import SupportPage from './pages/SupportPage';
import ActivityPage from './pages/ActivityPage';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isMapPage = location.pathname === '/map';

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Ukryj navbar na stronie głównej i mapie dla maksymalnej przestrzeni */}
      {!isHomePage && !isMapPage && <Navbar />}
      <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/add-parking" element={<AddParkingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-reservations" element={<MyReservationsPage />} />

              {/* ZMIANA 2: POPRAWKA BŁĘDU */}
              {/* Twój link w Navbarze to "/my-parkings", a trasa była "/owner-dashboard" */}
              {/* Poprawiłem ścieżkę, aby pasowała do linku: */}
              <Route path="/my-parkings" element={<OwnerDashboardPage />} />

              <Route path="/my-chargers" element={<ChargingDashboardPage />} />
              <Route path="/dodaj-parking" element={<AddParkingPage />} />

              {/* DeCharge Hackathon */}
              <Route path="/charging-map" element={<ChargingMapPage />} />
              <Route path="/add-charging-station" element={<AddChargingStationPage />} />
              <Route path="/live-feed" element={<LiveFeedPage />} />
              <Route path="/marketplace" element={<PointsMarketplacePage />} />
              <Route path="/badges" element={<BadgesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />

              {/* Sanctum Gateway */}
              <Route path="/gateway-dashboard" element={<GatewayDashboardPage />} />
              <Route path="/advanced-gateway" element={<AdvancedGatewayDashboard />} />
              <Route path="/gateway-showcase" element={<GatewayShowcase />} />
              <Route path="/achievements" element={<AchievementsPage />} />

              {/* Mastercard DeFi Hackathon - Parking Marketplace */}
              <Route path="/parking-marketplace" element={<ParkingMarketplacePage />} />
              <Route path="/institutional-operator" element={<InstitutionalOperatorDashboard />} />

              {/* New Features */}
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/activity" element={<ActivityPage />} />
            </Routes>
          </div>
  );
}

function App() {
  return (
    <SolanaWalletProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </SolanaWalletProvider>
  );
}

export default App;