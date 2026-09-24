import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AuthHeatmap from './features/auth/AuthHeatmap';
import AuthFeed from './features/auth/AuthFeed';
import AuthTextArea from './features/auth/AuthTextArea';
import AuthDonut from './features/auth/AuthDonut';
import AuthMeter from './features/auth/AuthMeter';
import './App.css';

const AuthStepperPage = lazy(() => import('./features/auth/AuthStepper'));
const DashboardPaginatedPage = lazy(() => import('./features/dashboard/DashboardPaginated'));
const ProductsScatterPage = lazy(() => import('./features/products/ProductsScatter'));
const OrdersStepperPage = lazy(() => import('./features/orders/OrdersStepper'));
const UsersSnackbarPage = lazy(() => import('./features/users/UsersSnackbar'));
const SettingsAutocompletePage = lazy(() => import('./features/settings/SettingsAutocomplete'));
const NotificationsAvatarPage = lazy(() => import('./features/notifications/NotificationsAvatar'));
const AnalyticsSkeletonPage = lazy(() => import('./features/analytics/AnalyticsSkeleton'));
const ReportsTabsPage = lazy(() => import('./features/reports/ReportsTabs'));
const BillingFileUploadPage = lazy(() => import('./features/billing/BillingFileUpload'));
const InventoryHeaderPage = lazy(() => import('./features/inventory/InventoryHeader'));
const ShippingSnackbarPage = lazy(() => import('./features/shipping/ShippingSnackbar'));
const PaymentsSpinnerPage = lazy(() => import('./features/payments/PaymentsSpinner'));
const ReviewsPopoverPage = lazy(() => import('./features/reviews/ReviewsPopover'));
const SearchPopoverPage = lazy(() => import('./features/search/SearchPopover'));
const CatalogStatPage = lazy(() => import('./features/catalog/CatalogStat'));
const CartSearchPage = lazy(() => import('./features/cart/CartSearch'));
const CheckoutLineChartPage = lazy(() => import('./features/checkout/CheckoutLineChart'));
const ProfileToastPage = lazy(() => import('./features/profile/ProfileToast'));
const AdminErrorBoundaryPage = lazy(() => import('./features/admin/AdminErrorBoundary'));
const AuditTooltipPage = lazy(() => import('./features/audit/AuditTooltip'));
const TagsBreadcrumbPage = lazy(() => import('./features/tags/TagsBreadcrumb'));
const CategoriesProviderPage = lazy(() => import('./features/categories/CategoriesProvider'));
const MediaCheckboxPage = lazy(() => import('./features/media/MediaCheckbox'));
const DocumentsPrefetchPage = lazy(() => import('./features/documents/DocumentsPrefetch'));
const WorkflowsTagPage = lazy(() => import('./features/workflows/WorkflowsTag'));
const IntegrationsAreaChartPage = lazy(() => import('./features/integrations/IntegrationsAreaChart'));
const WebhooksProgressPage = lazy(() => import('./features/webhooks/WebhooksProgress'));
const ApiKeysColorPickerPage = lazy(() => import('./features/api-keys/ApiKeysColorPicker'));
const ThemesRadioPage = lazy(() => import('./features/themes/ThemesRadio'));
const LocalizationLabelPage = lazy(() => import('./features/localization/LocalizationLabel'));
const PermissionsStickyPage = lazy(() => import('./features/permissions/PermissionsSticky'));
const RolesDetailPage = lazy(() => import('./features/roles/RolesDetail'));
const TeamsHOCPage = lazy(() => import('./features/teams/TeamsHOC'));
const ProjectsSearchPage = lazy(() => import('./features/projects/ProjectsSearch'));
const TasksDrawerPage = lazy(() => import('./features/tasks/TasksDrawer'));
const CommentsCachedPage = lazy(() => import('./features/comments/CommentsCached'));
const ActivityPreviewPage = lazy(() => import('./features/activity/ActivityPreview'));
const ExportsInputPage = lazy(() => import('./features/exports/ExportsInput'));
const ImportsInputPage = lazy(() => import('./features/imports/ImportsInput'));
const SchedulingBadgePage = lazy(() => import('./features/scheduling/SchedulingBadge'));
const CampaignsLinkPage = lazy(() => import('./features/campaigns/CampaignsLink'));
const TemplatesErrorBoundaryPage = lazy(() => import('./features/templates/TemplatesErrorBoundary'));
const FormsRetryPage = lazy(() => import('./features/forms/FormsRetry'));
const SurveysToastPage = lazy(() => import('./features/surveys/SurveysToast'));
const FeedbackMgmtInfiniteScrollPage = lazy(() => import('./features/feedback-mgmt/FeedbackMgmtInfiniteScroll'));
const SupportTimePickerPage = lazy(() => import('./features/support/SupportTimePicker'));
const KnowledgeBaseTablePage = lazy(() => import('./features/knowledge-base/KnowledgeBaseTable'));
const FaqAlertPage = lazy(() => import('./features/faq/FaqAlert'));
const OnboardingScorePage = lazy(() => import('./features/onboarding/OnboardingScore'));

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <h1 className="logo">MegaRepo</h1>
          <ul className="nav-links">
            <li><Link to="/auth">Auth</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/orders">Orders</Link></li>
            <li><Link to="/users">Users</Link></li>
            <li><Link to="/settings">Settings</Link></li>
            <li><Link to="/notifications">Notifications</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            <li><Link to="/billing">Billing</Link></li>
            <li><Link to="/inventory">Inventory</Link></li>
            <li><Link to="/shipping">Shipping</Link></li>
            <li><Link to="/payments">Payments</Link></li>
            <li><Link to="/reviews">Reviews</Link></li>
            <li><Link to="/search">Search</Link></li>
            <li><Link to="/catalog">Catalog</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/checkout">Checkout</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/admin">Admin</Link></li>
            <li><Link to="/audit">Audit</Link></li>
            <li><Link to="/tags">Tags</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/media">Media</Link></li>
            <li><Link to="/documents">Documents</Link></li>
            <li><Link to="/workflows">Workflows</Link></li>
            <li><Link to="/integrations">Integrations</Link></li>
            <li><Link to="/webhooks">Webhooks</Link></li>
            <li><Link to="/api-keys">ApiKeys</Link></li>
            <li><Link to="/themes">Themes</Link></li>
            <li><Link to="/localization">Localization</Link></li>
            <li><Link to="/permissions">Permissions</Link></li>
            <li><Link to="/roles">Roles</Link></li>
            <li><Link to="/teams">Teams</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li><Link to="/tasks">Tasks</Link></li>
            <li><Link to="/comments">Comments</Link></li>
            <li><Link to="/activity">Activity</Link></li>
            <li><Link to="/exports">Exports</Link></li>
            <li><Link to="/imports">Imports</Link></li>
            <li><Link to="/scheduling">Scheduling</Link></li>
            <li><Link to="/campaigns">Campaigns</Link></li>
            <li><Link to="/templates">Templates</Link></li>
            <li><Link to="/forms">Forms</Link></li>
            <li><Link to="/surveys">Surveys</Link></li>
            <li><Link to="/feedback-mgmt">FeedbackMgmt</Link></li>
            <li><Link to="/support">Support</Link></li>
            <li><Link to="/knowledge-base">KnowledgeBase</Link></li>
            <li><Link to="/faq">Faq</Link></li>
            <li><Link to="/onboarding">Onboarding</Link></li>
          </ul>
        </nav>
        <main className="main">
          <Suspense fallback={<div className="loading">Loading…</div>}>
            <Routes>
              <Route path="/" element={<div className="home"><AuthHeatmap /> <AuthFeed /> <AuthTextArea /> <AuthDonut /> <AuthMeter /></div>} />
              <Route path="/auth/*" element={<AuthStepperPage />} />
              <Route path="/dashboard/*" element={<DashboardPaginatedPage />} />
              <Route path="/products/*" element={<ProductsScatterPage />} />
              <Route path="/orders/*" element={<OrdersStepperPage />} />
              <Route path="/users/*" element={<UsersSnackbarPage />} />
              <Route path="/settings/*" element={<SettingsAutocompletePage />} />
              <Route path="/notifications/*" element={<NotificationsAvatarPage />} />
              <Route path="/analytics/*" element={<AnalyticsSkeletonPage />} />
              <Route path="/reports/*" element={<ReportsTabsPage />} />
              <Route path="/billing/*" element={<BillingFileUploadPage />} />
              <Route path="/inventory/*" element={<InventoryHeaderPage />} />
              <Route path="/shipping/*" element={<ShippingSnackbarPage />} />
              <Route path="/payments/*" element={<PaymentsSpinnerPage />} />
              <Route path="/reviews/*" element={<ReviewsPopoverPage />} />
              <Route path="/search/*" element={<SearchPopoverPage />} />
              <Route path="/catalog/*" element={<CatalogStatPage />} />
              <Route path="/cart/*" element={<CartSearchPage />} />
              <Route path="/checkout/*" element={<CheckoutLineChartPage />} />
              <Route path="/profile/*" element={<ProfileToastPage />} />
              <Route path="/admin/*" element={<AdminErrorBoundaryPage />} />
              <Route path="/audit/*" element={<AuditTooltipPage />} />
              <Route path="/tags/*" element={<TagsBreadcrumbPage />} />
              <Route path="/categories/*" element={<CategoriesProviderPage />} />
              <Route path="/media/*" element={<MediaCheckboxPage />} />
              <Route path="/documents/*" element={<DocumentsPrefetchPage />} />
              <Route path="/workflows/*" element={<WorkflowsTagPage />} />
              <Route path="/integrations/*" element={<IntegrationsAreaChartPage />} />
              <Route path="/webhooks/*" element={<WebhooksProgressPage />} />
              <Route path="/api-keys/*" element={<ApiKeysColorPickerPage />} />
              <Route path="/themes/*" element={<ThemesRadioPage />} />
              <Route path="/localization/*" element={<LocalizationLabelPage />} />
              <Route path="/permissions/*" element={<PermissionsStickyPage />} />
              <Route path="/roles/*" element={<RolesDetailPage />} />
              <Route path="/teams/*" element={<TeamsHOCPage />} />
              <Route path="/projects/*" element={<ProjectsSearchPage />} />
              <Route path="/tasks/*" element={<TasksDrawerPage />} />
              <Route path="/comments/*" element={<CommentsCachedPage />} />
              <Route path="/activity/*" element={<ActivityPreviewPage />} />
              <Route path="/exports/*" element={<ExportsInputPage />} />
              <Route path="/imports/*" element={<ImportsInputPage />} />
              <Route path="/scheduling/*" element={<SchedulingBadgePage />} />
              <Route path="/campaigns/*" element={<CampaignsLinkPage />} />
              <Route path="/templates/*" element={<TemplatesErrorBoundaryPage />} />
              <Route path="/forms/*" element={<FormsRetryPage />} />
              <Route path="/surveys/*" element={<SurveysToastPage />} />
              <Route path="/feedback-mgmt/*" element={<FeedbackMgmtInfiniteScrollPage />} />
              <Route path="/support/*" element={<SupportTimePickerPage />} />
              <Route path="/knowledge-base/*" element={<KnowledgeBaseTablePage />} />
              <Route path="/faq/*" element={<FaqAlertPage />} />
              <Route path="/onboarding/*" element={<OnboardingScorePage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
