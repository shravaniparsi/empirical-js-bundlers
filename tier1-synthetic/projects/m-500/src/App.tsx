import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AuthFeed from './features/auth/AuthFeed';
import AuthTextArea from './features/auth/AuthTextArea';
import AuthDonut from './features/auth/AuthDonut';
import AuthConfirm from './features/auth/AuthConfirm';
import AuthFeed1 from './features/auth/AuthFeed1';
import './App.css';

const AuthHeatmapPage = lazy(() => import('./features/auth/AuthHeatmap'));
const DashboardPieChartPage = lazy(() => import('./features/dashboard/DashboardPieChart'));
const OrdersStickyPage = lazy(() => import('./features/orders/OrdersSticky'));
const UsersHeaderPage = lazy(() => import('./features/users/UsersHeader'));
const NotificationsLabelPage = lazy(() => import('./features/notifications/NotificationsLabel'));
const AnalyticsTagPage = lazy(() => import('./features/analytics/AnalyticsTag'));
const ReportsSpinnerPage = lazy(() => import('./features/reports/ReportsSpinner'));
const BillingTextAreaPage = lazy(() => import('./features/billing/BillingTextArea'));
const InventoryStepperPage = lazy(() => import('./features/inventory/InventoryStepper'));
const ShippingFileUploadPage = lazy(() => import('./features/shipping/ShippingFileUpload'));
const PaymentsCardPage = lazy(() => import('./features/payments/PaymentsCard'));
const ReviewsPopoverPage = lazy(() => import('./features/reviews/ReviewsPopover'));

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <h1 className="logo">ShopDash</h1>
          <ul className="nav-links">
            <li><Link to="/auth">Auth</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/orders">Orders</Link></li>
            <li><Link to="/users">Users</Link></li>
            <li><Link to="/notifications">Notifications</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            <li><Link to="/billing">Billing</Link></li>
            <li><Link to="/inventory">Inventory</Link></li>
            <li><Link to="/shipping">Shipping</Link></li>
            <li><Link to="/payments">Payments</Link></li>
            <li><Link to="/reviews">Reviews</Link></li>
          </ul>
        </nav>
        <main className="main">
          <Suspense fallback={<div className="loading">Loading…</div>}>
            <Routes>
              <Route path="/" element={<div className="home"><AuthFeed /> <AuthTextArea /> <AuthDonut /> <AuthConfirm /> <AuthFeed1 /></div>} />
              <Route path="/auth/*" element={<AuthHeatmapPage />} />
              <Route path="/dashboard/*" element={<DashboardPieChartPage />} />
              <Route path="/orders/*" element={<OrdersStickyPage />} />
              <Route path="/users/*" element={<UsersHeaderPage />} />
              <Route path="/notifications/*" element={<NotificationsLabelPage />} />
              <Route path="/analytics/*" element={<AnalyticsTagPage />} />
              <Route path="/reports/*" element={<ReportsSpinnerPage />} />
              <Route path="/billing/*" element={<BillingTextAreaPage />} />
              <Route path="/inventory/*" element={<InventoryStepperPage />} />
              <Route path="/shipping/*" element={<ShippingFileUploadPage />} />
              <Route path="/payments/*" element={<PaymentsCardPage />} />
              <Route path="/reviews/*" element={<ReviewsPopoverPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
