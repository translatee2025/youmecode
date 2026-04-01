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
                    <Route path="categories" element={<AdminPlaceholder title="Category Manager" />} />
                    <Route path="filters" element={<AdminPlaceholder title="Filter Management" />} />
                    <Route path="product-types" element={<AdminPlaceholder title="Product Types" />} />
                    <Route path="pages" element={<AdminPlaceholder title="Pages" />} />
                    <Route path="blog" element={<AdminPlaceholder title="Blog" />} />
                    <Route path="faq" element={<AdminPlaceholder title="FAQ" />} />
                    <Route path="events" element={<AdminPlaceholder title="Events" />} />
                    <Route path="users" element={<AdminPlaceholder title="Users" />} />
                    <Route path="venues" element={<AdminPlaceholder title="Venues" />} />
                    <Route path="products" element={<AdminPlaceholder title="Products" />} />
                    <Route path="claims" element={<AdminPlaceholder title="Claims" />} />
                    <Route path="moderation" element={<AdminPlaceholder title="Moderation" />} />
                    <Route path="discussions" element={<AdminPlaceholder title="Discussion Boards" />} />
                    <Route path="groups" element={<AdminPlaceholder title="Groups" />} />
                    <Route path="subscriptions" element={<AdminPlaceholder title="Subscription Plans" />} />
                    <Route path="ads" element={<AdminPlaceholder title="Ad Slots" />} />
                    <Route path="import" element={<AdminPlaceholder title="CSV Import" />} />
                    <Route path="translations" element={<AdminPlaceholder title="Translations" />} />
                    <Route path="analytics" element={<AdminPlaceholder title="Analytics" />} />
                    <Route path="permissions" element={<AdminPlaceholder title="Permissions" />} />
                    <Route path="webhooks" element={<AdminPlaceholder title="Webhooks" />} />
                    <Route path="audit" element={<AdminPlaceholder title="Audit Log" />} />
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
