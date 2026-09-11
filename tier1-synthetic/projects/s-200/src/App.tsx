import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AuthStepper from './features/auth/AuthStepper';
import AuthHeatmap from './features/auth/AuthHeatmap';
import AuthFeed from './features/auth/AuthFeed';
import AuthTextArea from './features/auth/AuthTextArea';
import AuthDonut from './features/auth/AuthDonut';
import './App.css';

const ProductsSearchPage = lazy(() => import('./features/products/ProductsSearch'));
const NotificationsGridPage = lazy(() => import('./features/notifications/NotificationsGrid'));
const AnalyticsAvatarPage = lazy(() => import('./features/analytics/AnalyticsAvatar'));
const ReportsBottomNavPage = lazy(() => import('./features/reports/ReportsBottomNav'));

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <h1 className="logo">TaskBoard</h1>
          <ul className="nav-links">
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/notifications">Notifications</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/reports">Reports</Link></li>
          </ul>
        </nav>
        <main className="main">
          <Suspense fallback={<div className="loading">Loading…</div>}>
            <Routes>
              <Route path="/" element={<div className="home"><AuthStepper /> <AuthHeatmap /> <AuthFeed /> <AuthTextArea /> <AuthDonut /></div>} />
              <Route path="/products/*" element={<ProductsSearchPage />} />
              <Route path="/notifications/*" element={<NotificationsGridPage />} />
              <Route path="/analytics/*" element={<AnalyticsAvatarPage />} />
              <Route path="/reports/*" element={<ReportsBottomNavPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
