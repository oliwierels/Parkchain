import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import LiveFeedPage from './pages/LiveFeedPage';
import PointsMarketplacePage from './pages/PointsMarketplacePage';
import BadgesPage from './pages/BadgesPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <SolanaWalletProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* ZMIANA 1: Zmieniono tło na bg-gray-900 dla spójności */}
          <div className="min-h-screen bg-gray-900">
            <Navbar />
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
              <Route path="/live-feed" element={<LiveFeedPage />} />
              <Route path="/marketplace" element={<PointsMarketplacePage />} />
              <Route path="/badges" element={<BadgesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </SolanaWalletProvider>
  );
}

export default App;