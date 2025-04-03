import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/useFirebaseAuth";
import { ProtectedRoute } from "@/lib/protected-route";

// Pages
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LibraryPage from "@/pages/library-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";
import PaymentSuccessPage from "@/pages/payment-success-page";
import StorePage from "@/pages/store-page";
import SubscriptionPage from "@/pages/subscription-page";
import SubscriptionPaymentPage from "@/pages/subscription-payment-page";
import ArtistDashboardPage from "@/pages/artist-dashboard-page";
import ArtistProfilePage from "@/pages/artist-profile-page";
import ProfilePage from "@/pages/profile-page";
import CreatePlaylistPage from "@/pages/create-playlist-page";
import PlaylistPage from "@/pages/playlist-page";
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
      <main className={`flex-1 overflow-y-auto pt-14 md:pt-0 ${currentTrack ? 'pb-44 md:pb-24' : 'pb-24 md:pb-0'}`}>
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

      <ProtectedRoute path="/checkout" component={() => (
        <AppLayout>
          <CheckoutPage />
        </AppLayout>
      )} />

      <ProtectedRoute path="/payment-success" component={() => (
        <AppLayout>
          <PaymentSuccessPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/subscriptions" component={() => (
        <AppLayout>
          <SubscriptionPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/subscription-payment" component={() => (
        <AppLayout>
          <SubscriptionPaymentPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/artist-dashboard" component={() => (
        <AppLayout>
          <ArtistDashboardPage />
        </AppLayout>
      )} />

      <ProtectedRoute path="/artist-profile" component={() => (
        <AppLayout>
          <ArtistProfilePage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/profile" component={() => (
        <AppLayout>
          <ProfilePage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/create-playlist" component={() => (
        <AppLayout>
          <CreatePlaylistPage />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/playlists/:id" component={() => (
        <AppLayout>
          <PlaylistPage />
        </AppLayout>
      )} />
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

import { AuthProvider as UseAuthProvider } from "@/hooks/use-auth";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UseAuthProvider>
          <Router />
          <Toaster />
        </UseAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
