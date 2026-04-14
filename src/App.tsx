import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { RequireCreator } from "@/components/guards/RequireCreator";

import AuthPage from "@/pages/AuthPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminModules from "@/pages/admin/AdminModules";
import AdminTheme from "@/pages/admin/AdminTheme";
import AdminSiteSettings from "@/pages/admin/AdminSiteSettings";
import AdminAI from "@/pages/admin/AdminAI";
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
import AdminPlaceholder from "@/pages/admin/AdminPlaceholder";
import AdminPages from "@/pages/admin/AdminPages";
import AdminDiscussions from "@/pages/admin/AdminDiscussions";
import AdminGroups from "@/pages/admin/AdminGroups";
import AdminSecurity from "@/pages/admin/AdminSecurity";
import DirectoryPage from "@/pages/DirectoryPage";
import VenueDetailPage from "@/pages/VenueDetailPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import UserProfilePage from "@/pages/UserProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
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
import Index from "@/pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <CookieConsent />
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
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

                  {/* Admin */}
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
                    <Route index element={<AdminDashboard />} />
                    <Route path="modules" element={<AdminModules />} />
                    <Route path="theme" element={<AdminTheme />} />
                    <Route path="settings" element={<AdminSiteSettings />} />
                    <Route path="ai" element={<AdminAI />} />
                    <Route path="categories" element={<CategoryManager />} />
                    <Route path="filters" element={<FilterManagement />} />
                    <Route path="product-types" element={<ProductTypeManager />} />
                    <Route path="pages" element={<AdminPages />} />
                    <Route path="blog" element={<BlogEditor />} />
                    <Route path="faq" element={<FaqManager />} />
                    <Route path="events" element={<EventsAdmin />} />
                    <Route path="users" element={<UserManager />} />
                    <Route path="venues" element={<VenueManager />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="claims" element={<ClaimsManager />} />
                    <Route path="moderation" element={<ModerationQueue />} />
                    <Route path="discussions" element={<AdminDiscussions />} />
                    <Route path="groups" element={<AdminGroups />} />
                    <Route path="subscriptions" element={<SubscriptionPlans />} />
                    <Route path="ads" element={<AdSlotsManager />} />
                    <Route path="import" element={<CsvImport />} />
                    <Route path="translations" element={<TranslationsManager />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="platform-users" element={<PlatformUsersPage />} />
                    <Route path="permissions" element={<PermissionsMatrix />} />
                    <Route path="webhooks" element={<WebhooksManager />} />
                    <Route path="audit" element={<AuditLog />} />
                    <Route path="health" element={<HealthPage />} />
                    <Route path="security" element={<AdminSecurity />} />
                    <Route path="platform-settings" element={<PlatformSettingsPage />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
