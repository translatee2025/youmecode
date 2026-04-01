import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";

import { useEffect } from "react";
import { TenantProvider } from "@/providers/TenantProvider";
import { useTenantStore } from "@/stores/tenantStore";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { RequireCreator } from "@/components/guards/RequireCreator";

import AuthPage from "@/pages/AuthPage";
import SetupPage from "@/pages/SetupPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminPlaceholder from "@/pages/admin/AdminPlaceholder";
import CategoryManager from "@/pages/admin/CategoryManager";
import FilterManagement from "@/pages/admin/FilterManagement";
import ProductTypeManager from "@/pages/admin/ProductTypeManager";
import UserManager from "@/pages/admin/UserManager";
import VenueManager from "@/pages/admin/VenueManager";
import ProductManager from "@/pages/admin/ProductManager";
import ClaimsManager from "@/pages/admin/ClaimsManager";
import ModerationQueue from "@/pages/admin/ModerationQueue";
import PermissionsMatrix from "@/pages/admin/PermissionsMatrix";
import CsvImport from "@/pages/admin/CsvImport";
import SubscriptionPlans from "@/pages/admin/SubscriptionPlans";
import AdSlotsManager from "@/pages/admin/AdSlotsManager";
import TranslationsManager from "@/pages/admin/TranslationsManager";
import WebhooksManager from "@/pages/admin/WebhooksManager";
import AuditLog from "@/pages/admin/AuditLog";
import BlogEditor from "@/pages/admin/BlogEditor";
import FaqManager from "@/pages/admin/FaqManager";
import DirectoryPage from "@/pages/DirectoryPage";
import VenueDetailPage from "@/pages/VenueDetailPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import UserProfilePage from "@/pages/UserProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import OnboardingWizard from "@/pages/onboarding/OnboardingWizard";
import CreateVenuePage from "@/pages/CreateVenuePage";
import ClaimVenuePage from "@/pages/ClaimVenuePage";
import ClaimStatusPage from "@/pages/ClaimStatusPage";
import CommerceActivationPage from "@/pages/CommerceActivationPage";
import AddProductPage from "@/pages/AddProductPage";
import FeedPage from "@/pages/FeedPage";
import ReelsPage from "@/pages/ReelsPage";
import ExplorePage from "@/pages/ExplorePage";
import HashtagPage from "@/pages/HashtagPage";
import LeaderboardsPage from "@/pages/LeaderboardsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import CollectionsPage from "@/pages/CollectionsPage";
import VenueAdminPage from "@/pages/VenueAdminPage";
import MessagesPage from "@/pages/MessagesPage";
import ChatRoomsPage from "@/pages/ChatRoomsPage";
import DiscussionsPage from "@/pages/DiscussionsPage";
import GroupsPage from "@/pages/GroupsPage";
import PollsPage from "@/pages/PollsPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import CmsPage from "@/pages/CmsPage";
import FaqPage from "@/pages/FaqPage";
import EventsPage from "@/pages/EventsPage";
import EventDetailPage from "@/pages/EventDetailPage";
import CreateEventPage from "@/pages/CreateEventPage";
import CitiesPage from "@/pages/CitiesPage";
import CityDetailPage from "@/pages/CityDetailPage";
import ChartsPage from "@/pages/ChartsPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import EventsAdmin from "@/pages/admin/EventsAdmin";
import HealthPage from "@/pages/admin/HealthPage";
import PlatformUsersPage from "@/pages/admin/PlatformUsersPage";
import PlatformSettingsPage from "@/pages/admin/PlatformSettingsPage";
import CookieConsent from "@/components/CookieConsent";

const queryClient = new QueryClient();

function HomePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-bg, #0a0a0a)' }}
    >
      <div className="text-center space-y-4">
        <h1
          className="text-4xl font-bold"
          style={{ color: 'var(--color-text, #f0f0f0)' }}
        >
          Welcome
        </h1>
        <p style={{ color: 'var(--color-text-muted, #888)' }}>
          Your platform is loading. Module pages coming soon.
        </p>
      </div>
    </div>
  );
}

function TenantGate({ children }: { children: React.ReactNode }) {
  const tenant = useTenantStore((s) => s.tenant);
  const error = useTenantStore((s) => s.error);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // No tenant and no DB error → fresh deployment, go to /setup
    if (!tenant && error === 'no_tenant' && location.pathname !== '/setup') {
      navigate('/setup', { replace: true });
    }
    // Tenant exists but onboarding not done → redirect to /onboarding
    if (tenant && tenant.onboarding_completed === false && location.pathname !== '/onboarding' && location.pathname !== '/setup') {
      navigate('/onboarding', { replace: true });
    }
  }, [tenant, error, location.pathname, navigate]);

  return <>{children}</>;
}

const App = () => (
  <HelmetProvider>
  <TenantProvider>
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <TenantGate>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/setup" element={<SetupPage />} />
                  <Route path="/create-platform" element={<AuthPage />} />
                  <Route path="/directory" element={<DirectoryPage />} />
                  <Route path="/venues/:slug" element={<VenueDetailPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/users/:username" element={<UserProfilePage />} />
                  <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
                  <Route path="/create-venue" element={<RequireAuth><CreateVenuePage /></RequireAuth>} />
                  <Route path="/claim/:venueId" element={<RequireAuth><ClaimVenuePage /></RequireAuth>} />
                  <Route path="/claim/:venueId/status" element={<RequireAuth><ClaimStatusPage /></RequireAuth>} />
                  <Route path="/subscribe/:venueId" element={<RequireAuth><CommerceActivationPage /></RequireAuth>} />
                  <Route path="/add-product" element={<RequireAuth><AddProductPage /></RequireAuth>} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/reels" element={<ReelsPage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/hashtag/:tag" element={<HashtagPage />} />
                  <Route path="/leaderboards" element={<LeaderboardsPage />} />
                  <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                  <Route path="/collections" element={<RequireAuth><CollectionsPage /></RequireAuth>} />
                  <Route path="/venue-admin/:venueId" element={<RequireAuth><VenueAdminPage /></RequireAuth>} />
                  <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
                  <Route path="/chat" element={<ChatRoomsPage />} />
                  <Route path="/discussions" element={<DiscussionsPage />} />
                  <Route path="/discussions/:boardSlug" element={<DiscussionsPage />} />
                  <Route path="/discussions/:boardSlug/:threadId" element={<DiscussionsPage />} />
                  <Route path="/groups" element={<GroupsPage />} />
                  <Route path="/groups/:id" element={<GroupsPage />} />
                  <Route path="/polls" element={<PollsPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/pages/:slug" element={<CmsPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/create" element={<RequireAuth><CreateEventPage /></RequireAuth>} />
                  <Route path="/events/:id" element={<EventDetailPage />} />
                  <Route path="/cities" element={<CitiesPage />} />
                  <Route path="/city/:citySlug" element={<CityDetailPage />} />
                  <Route path="/charts" element={<ChartsPage />} />

                  {/* Admin — Creator only (both Creator + Platform modes) */}
                  <Route
                    path="/admin"
                    element={
                      <RequireAuth>
                        <RequireCreator>
                          <AdminLayout />
                        </RequireCreator>
                      </RequireAuth>
                    }
                  >
                    {/* Creator mode pages */}
                    <Route index element={<AdminPlaceholder title="Dashboard" />} />
                    <Route path="modules" element={<AdminPlaceholder title="Modules" />} />
                    <Route path="theme" element={<AdminPlaceholder title="Theme" />} />
                    <Route path="settings" element={<AdminPlaceholder title="Site Settings" />} />
                    <Route path="ai" element={<AdminPlaceholder title="AI & Translation" />} />
                    <Route path="categories" element={<CategoryManager />} />
                    <Route path="filters" element={<FilterManagement />} />
                    <Route path="product-types" element={<ProductTypeManager />} />
                    <Route path="pages" element={<AdminPlaceholder title="Pages" />} />
                    <Route path="blog" element={<BlogEditor />} />
                    <Route path="faq" element={<FaqManager />} />
                    <Route path="events" element={<EventsAdmin />} />
                    <Route path="users" element={<UserManager />} />
                    <Route path="venues" element={<VenueManager />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="claims" element={<ClaimsManager />} />
                    <Route path="moderation" element={<ModerationQueue />} />
                    <Route path="discussions" element={<AdminPlaceholder title="Discussion Boards" />} />
                    <Route path="groups" element={<AdminPlaceholder title="Groups" />} />
                    <Route path="subscriptions" element={<SubscriptionPlans />} />
                    <Route path="ads" element={<AdSlotsManager />} />
                    <Route path="import" element={<CsvImport />} />
                    <Route path="translations" element={<TranslationsManager />} />

                    {/* Platform mode pages */}
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="platform-users" element={<PlatformUsersPage />} />
                    <Route path="permissions" element={<PermissionsMatrix />} />
                    <Route path="webhooks" element={<WebhooksManager />} />
                    <Route path="audit" element={<AuditLog />} />
                    <Route path="health" element={<HealthPage />} />
                    <Route path="security" element={<AdminPlaceholder title="Security" />} />
                    <Route path="platform-settings" element={<PlatformSettingsPage />} />
                  </Route>

                  <Route path="/onboarding" element={<OnboardingWizard />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
                </TenantGate>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  </TenantProvider>
  </HelmetProvider>
);

export default App;
