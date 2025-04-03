import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useAuth } from "@/hooks/use-auth";
import { Playlist } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useCartStore } from "@/stores/useCartStore";
import { CartIndicator } from "@/components/cart/CartIndicator";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  Search, 
  Library, 
  ShoppingBag, 
  Heart, 
  Download, 
  ShoppingCart, 
  Plus,
  Settings,
  Shield,
  BarChart,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

// Define the subscription data interface outside of the component
interface SubscriptionData {
  active: boolean;
  planId?: number;
  userId?: number;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  paymentMethod?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const playlists = useLibraryStore((state) => state.playlists);
  
  // Need to move all hooks to the top level
  const { data: userSubscription } = useQuery<SubscriptionData>({
    queryKey: ['/api/me/subscription'],
    enabled: !!user, // Only run this query when we have a user
  });
  
  // Compute subscription status at the top level
  const hasPremiumPlan = userSubscription?.planId === 2 || userSubscription?.planId === 3;
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: t('auth.logoutSuccess'),
          description: t('auth.logoutSuccessMessage'),
          variant: "default",
        });
        // Properly redirect to auth page using wouter's setLocation
        setTimeout(() => {
          setLocation("/auth");
        }, 300);
      },
      onError: (error) => {
        toast({
          title: t('auth.logoutError'),
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const baseNavItems = [
    { icon: Home, label: t('common.home'), path: '/' },
    { icon: Search, label: t('common.search'), path: '/search' },
    { icon: Library, label: t('common.library'), path: '/library' },
    { icon: ShoppingBag, label: t('common.store'), path: '/store' },
    { icon: Shield, label: t('common.premium'), path: '/subscriptions' },
    // Cart has special handling for the icon (CartIndicator)
    { icon: ShoppingCart, label: t('common.cart'), path: '/cart' },
  ];
  
  // Add Artist Dashboard and Profile links for users with artist role
  const navItems = user?.role === 'artist' 
    ? [
        ...baseNavItems, 
        { icon: BarChart, label: t('common.artistDashboard'), path: '/artist-dashboard' },
        { icon: User, label: t('common.artistProfile'), path: '/artist-profile' }
      ]
    : baseNavItems;

  const collectionItems = [
    { icon: Heart, label: t('common.liked'), path: '/library/liked' },
    { icon: Download, label: t('common.downloaded'), path: '/library/downloaded' },
    { icon: ShoppingCart, label: t('common.purchased'), path: '/library/purchased' },
  ];

  // Render the premium subscription UI based on subscription status
  const renderSubscriptionUI = () => {
    if (hasPremiumPlan) {
      return (
        <div className="px-4 py-3 bg-primary/10 rounded-lg">
          <p className="text-sm font-medium text-primary">{t('subscription.subscribed')}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {userSubscription?.planId === 2 ? 'Premium' : 'Ultimate'}
          </p>
          <Link href="/subscriptions">
            <Button 
              variant="outline"
              className="mt-2 w-full py-2 px-3 text-sm font-medium rounded-lg"
            >
              {t('subscription.manageSubscriptions')}
            </Button>
          </Link>
        </div>
      );
    } else {
      return (
        <div className="px-4 py-3 bg-primary/10 rounded-lg">
          <p className="text-sm font-medium text-primary">{t('common.premium')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('common.upgrade')}</p>
          <Link href="/subscriptions">
            <Button 
              variant="default"
              className="mt-2 w-full py-2 px-3 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg"
            >
              {t('common.upgradeNow')}
            </Button>
          </Link>
        </div>
      );
    }
  };

  return (
    <>
      {/* Mobile Top Navigation - Only visible on mobile */}
      <div className="flex md:hidden w-full justify-between items-center px-4 py-2 bg-background/95 backdrop-blur-lg border-b border-gray-800 fixed top-0 left-0 right-0 z-20">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="hsl(var(--primary))" strokeWidth="2"/>
              <path d="M9 16.5V7.5L16.5 12L9 16.5Z" fill="hsl(var(--primary))"/>
            </svg>
            <h1 className="text-lg font-bold">Harmonia</h1>
          </div>
        </Link>
        
        <div className="flex items-center space-x-4">
          {/* Cart */}
          <Link href="/cart">
            <div 
              className={cn(
                "flex items-center cursor-pointer",
                location === '/cart'
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CartIndicator />
            </div>
          </Link>
          
          {/* Logout Button for Mobile */}
          {user && (
            <div 
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </div>
          )}
          
          {/* Language Toggle for Mobile */}
          <LanguageToggle className="h-8 w-8 p-0" />
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex md:w-64 bg-background-elevated md:h-full md:flex-col md:p-4 md:border-r border-gray-800 md:overflow-y-auto scrollbar-hide md:sticky md:top-0 z-10 backdrop-blur-xl shadow-lg",
        className
      )}>
        <Link href="/">
          <div className="mb-8 flex items-center cursor-pointer">
            <svg className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="hsl(var(--primary))" strokeWidth="2"/>
              <path d="M9 16.5V7.5L16.5 12L9 16.5Z" fill="hsl(var(--primary))"/>
            </svg>
            <h1 className="text-2xl font-bold">Harmonia</h1>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div 
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg group cursor-pointer",
                    location === item.path
                      ? "text-white bg-background-highlight"
                      : "text-muted-foreground hover:text-white hover:bg-background-highlight"
                  )}
                >
                  {item.path === '/cart' ? (
                    <CartIndicator className="mr-3" />
                  ) : (
                    <item.icon className={cn(
                      "mr-3 h-5 w-5",
                      location === item.path
                        ? "text-primary"
                        : "group-hover:text-primary"
                    )} />
                  )}
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('common.yourCollection')}
            </h3>
            <div className="mt-4 space-y-1">
              {collectionItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <div 
                    className={cn(
                      "flex items-center px-4 py-2 rounded-lg cursor-pointer",
                      location === item.path
                        ? "text-white bg-background-highlight"
                        : "text-muted-foreground hover:text-white hover:bg-background-highlight"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('common.playlists')}
            </h3>
            <div className="mt-4 space-y-1">
              <Link href="/playlists/create">
                <div
                  className="flex items-center px-4 py-2 text-muted-foreground hover:text-white hover:bg-background-highlight rounded-lg cursor-pointer"
                >
                  <Plus className="mr-3 h-4 w-4" />
                  <span>{t('common.createPlaylist')}</span>
                </div>
              </Link>
              
              {/* Map through user playlists */}
              {playlists.map((playlist) => (
                <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                  <div 
                    className={cn(
                      "flex items-center px-4 py-2 rounded-lg cursor-pointer",
                      location === `/playlists/${playlist.id}`
                        ? "text-white bg-background-highlight"
                        : "text-muted-foreground hover:text-white hover:bg-background-highlight"
                    )}
                  >
                    <span className="truncate">{playlist.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Language Toggle, Logout, and Subscription upgrade prompt */}
        <div className="mt-auto pt-8 pb-16">
          {/* Language Toggle */}
          <div className="px-4 mb-4 flex justify-start">
            <LanguageToggle />
          </div>
          
          {/* Logout button */}
          {user && (
            <div className="px-4 mb-4">
              <Button 
                variant="outline"
                className="w-full py-2 px-3 text-sm font-medium rounded-lg flex items-center justify-center"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.logout')}
              </Button>
            </div>
          )}
          
          {/* Subscription upgrade prompt */}
          {user && renderSubscriptionUI()}
        </div>
      </aside>
      
      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <div className="flex md:hidden w-full justify-around items-center bg-background/95 backdrop-blur-lg border-t border-gray-800 fixed bottom-0 left-0 right-0 z-20">
        {/* Home Button */}
        <Link href="/">
          <div 
            className={cn(
              "flex flex-col items-center justify-center py-2 cursor-pointer",
              location === '/'
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('common.home')}</span>
          </div>
        </Link>
        
        {/* Search Button */}
        <Link href="/search">
          <div 
            className={cn(
              "flex flex-col items-center justify-center py-2 cursor-pointer",
              location === '/search'
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('common.search')}</span>
          </div>
        </Link>
        
        {/* Library Button */}
        <Link href="/library">
          <div 
            className={cn(
              "flex flex-col items-center justify-center py-2 cursor-pointer",
              location.startsWith('/library')
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Library className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('common.library')}</span>
          </div>
        </Link>
        
        {/* Store Button */}
        <Link href="/store">
          <div 
            className={cn(
              "flex flex-col items-center justify-center py-2 cursor-pointer",
              location === '/store'
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBag className="h-5 w-5 mb-1" />
            <span className="text-xs">{t('common.store')}</span>
          </div>
        </Link>
        
        {/* Premium Button */}
        {user && (
          <Link href="/subscriptions">
            <div
              className={cn(
                "flex flex-col items-center justify-center py-2 cursor-pointer",
                location === '/subscriptions'
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {hasPremiumPlan ? (
                <Shield className="h-5 w-5 mb-1 text-primary" />
              ) : (
                <Shield className="h-5 w-5 mb-1" />
              )}
              <span className="text-xs">
                {t('common.premium')}
              </span>
            </div>
          </Link>
        )}
        
        {/* Artist Dashboard Button - Only for artists */}
        {user?.role === 'artist' && (
          <>
            <Link href="/artist-dashboard">
              <div 
                className={cn(
                  "flex flex-col items-center justify-center py-2 cursor-pointer",
                  location === '/artist-dashboard'
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart className="h-5 w-5 mb-1" />
                <span className="text-xs">{t('common.artistDashboard')}</span>
              </div>
            </Link>
            <Link href="/artist-profile">
              <div 
                className={cn(
                  "flex flex-col items-center justify-center py-2 cursor-pointer",
                  location === '/artist-profile'
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="h-5 w-5 mb-1" />
                <span className="text-xs">{t('common.artistProfile')}</span>
              </div>
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default Sidebar;