import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Pages
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LibraryPage from "@/pages/library-page";
import CartPage from "@/pages/cart-page";
import StorePage from "@/pages/store-page";
import NotFound from "@/pages/not-found";

// Layout components
import Sidebar from "@/components/layout/Sidebar";
import MusicPlayer from "@/components/layout/MusicPlayer";

// i18n
import "@/lib/i18n";
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/usePlayerStore";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  
  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${currentTrack ? 'mb-24 md:mb-32' : ''}`}>
        {children}
      </main>
      <MusicPlayer />
    </div>
  );
};

function Router() {
  const { i18n } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  
  // Initialize language from settings
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [i18n, language]);
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/" component={() => (
        <AppLayout>
          <HomePage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/library" component={() => (
        <AppLayout>
          <LibraryPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/library/:section" component={() => (
        <AppLayout>
          <LibraryPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/cart" component={() => (
        <AppLayout>
          <CartPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/store" component={() => (
        <AppLayout>
          <StorePage />
        </AppLayout>
      )} />
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
