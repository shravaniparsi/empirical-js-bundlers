import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AuthHeatmap from './features/auth/AuthHeatmap';
import AuthFeed from './features/auth/AuthFeed';
import AuthTextArea from './features/auth/AuthTextArea';
import AuthDonut from './features/auth/AuthDonut';
import AuthMeter from './features/auth/AuthMeter';
import './App.css';

const AuthStepperPage = lazy(() => import('./features/auth/AuthStepper'));
const OrdersResponsivePage = lazy(() => import('./features/orders/OrdersResponsive'));
const UsersPaginationPage = lazy(() => import('./features/users/UsersPagination'));
const SettingsTimelinePage = lazy(() => import('./features/settings/SettingsTimeline'));
const AnalyticsAvatarPage = lazy(() => import('./features/analytics/AnalyticsAvatar'));
const ReportsPollingPage = lazy(() => import('./features/reports/ReportsPolling'));
const InventorySliderPage = lazy(() => import('./features/inventory/InventorySlider'));
const ShippingBannerPage = lazy(() => import('./features/shipping/ShippingBanner'));
const PaymentsTabsPage = lazy(() => import('./features/payments/PaymentsTabs'));
const ReviewsAccordionPage = lazy(() => import('./features/reviews/ReviewsAccordion'));
const CatalogGridPage = lazy(() => import('./features/catalog/CatalogGrid'));
const ProfileRangeSliderPage = lazy(() => import('./features/profile/ProfileRangeSlider'));
const AdminSummaryPage = lazy(() => import('./features/admin/AdminSummary'));
const AuditListPage = lazy(() => import('./features/audit/AuditList'));
const TagsAutocompletePage = lazy(() => import('./features/tags/TagsAutocomplete'));
const DocumentsPieChartPage = lazy(() => import('./features/documents/DocumentsPieChart'));
const IntegrationsPaginationPage = lazy(() => import('./features/integrations/IntegrationsPagination'));
const WebhooksRadioPage = lazy(() => import('./features/webhooks/WebhooksRadio'));
const ApiKeysTreeViewPage = lazy(() => import('./features/api-keys/ApiKeysTreeView'));
const ThemesScorePage = lazy(() => import('./features/themes/ThemesScore'));

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <h1 className="logo">MegaRepo</h1>
          <ul className="nav-links">
            <li><Link to="/auth">Auth</Link></li>
            <li><Link to="/orders">Orders</Link></li>
            <li><Link to="/users">Users</Link></li>
            <li><Link to="/settings">Settings</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            <li><Link to="/inventory">Inventory</Link></li>
            <li><Link to="/shipping">Shipping</Link></li>
            <li><Link to="/payments">Payments</Link></li>
            <li><Link to="/reviews">Reviews</Link></li>
            <li><Link to="/catalog">Catalog</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/admin">Admin</Link></li>
            <li><Link to="/audit">Audit</Link></li>
            <li><Link to="/tags">Tags</Link></li>
            <li><Link to="/documents">Documents</Link></li>
            <li><Link to="/integrations">Integrations</Link></li>
            <li><Link to="/webhooks">Webhooks</Link></li>
            <li><Link to="/api-keys">ApiKeys</Link></li>
            <li><Link to="/themes">Themes</Link></li>
          </ul>
        </nav>
        <main className="main">
          <Suspense fallback={<div className="loading">Loading…</div>}>
            <Routes>
              <Route path="/" element={<div className="home"><AuthHeatmap /> <AuthFeed /> <AuthTextArea /> <AuthDonut /> <AuthMeter /></div>} />
              <Route path="/auth/*" element={<AuthStepperPage />} />
              <Route path="/orders/*" element={<OrdersResponsivePage />} />
              <Route path="/users/*" element={<UsersPaginationPage />} />
              <Route path="/settings/*" element={<SettingsTimelinePage />} />
              <Route path="/analytics/*" element={<AnalyticsAvatarPage />} />
              <Route path="/reports/*" element={<ReportsPollingPage />} />
              <Route path="/inventory/*" element={<InventorySliderPage />} />
              <Route path="/shipping/*" element={<ShippingBannerPage />} />
              <Route path="/payments/*" element={<PaymentsTabsPage />} />
              <Route path="/reviews/*" element={<ReviewsAccordionPage />} />
              <Route path="/catalog/*" element={<CatalogGridPage />} />
              <Route path="/profile/*" element={<ProfileRangeSliderPage />} />
              <Route path="/admin/*" element={<AdminSummaryPage />} />
              <Route path="/audit/*" element={<AuditListPage />} />
              <Route path="/tags/*" element={<TagsAutocompletePage />} />
              <Route path="/documents/*" element={<DocumentsPieChartPage />} />
              <Route path="/integrations/*" element={<IntegrationsPaginationPage />} />
              <Route path="/webhooks/*" element={<WebhooksRadioPage />} />
              <Route path="/api-keys/*" element={<ApiKeysTreeViewPage />} />
              <Route path="/themes/*" element={<ThemesScorePage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
