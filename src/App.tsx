import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { TenantProvider } from "@/providers/TenantProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { RequireAuth } from "@/components/guards/RequireAuth";
import { RequireCreator } from "@/components/guards/RequireCreator";
import { RequirePlatformAdmin } from "@/components/guards/RequirePlatformAdmin";

import AuthPage from "@/pages/AuthPage";
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
import PlatformLayout from "@/pages/platform/PlatformLayout";
import NotFound from "@/pages/NotFound";
import OnboardingWizard from "@/pages/onboarding/OnboardingWizard";

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

const App = () => (
  <TenantProvider>
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/create-platform" element={<AuthPage />} />

                  {/* Admin — Creator only */}
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
                    <Route path="events" element={<AdminPlaceholder title="Events" />} />
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
                    <Route path="analytics" element={<AdminPlaceholder title="Analytics" />} />
                    <Route path="permissions" element={<PermissionsMatrix />} />
                    <Route path="webhooks" element={<WebhooksManager />} />
                    <Route path="audit" element={<AuditLog />} />
                    <Route path="health" element={<AdminPlaceholder title="Health" />} />
                    <Route path="health" element={<AdminPlaceholder title="Health" />} />
                  </Route>

                  {/* Platform Admin */}
                  <Route
                    path="/platform"
                    element={
                      <RequireAuth>
                        <RequirePlatformAdmin>
                          <PlatformLayout />
                        </RequirePlatformAdmin>
                      </RequireAuth>
                    }
                  >
                    <Route index element={<AdminPlaceholder title="Platform Dashboard" />} />
                    <Route path="tenants" element={<AdminPlaceholder title="Tenants" />} />
                    <Route path="users" element={<AdminPlaceholder title="Platform Users" />} />
                    <Route path="analytics" element={<AdminPlaceholder title="Platform Analytics" />} />
                    <Route path="security" element={<AdminPlaceholder title="Security" />} />
                    <Route path="settings" element={<AdminPlaceholder title="Platform Settings" />} />
                  </Route>

                  <Route path="/onboarding" element={<OnboardingWizard />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  </TenantProvider>
);

export default App;
