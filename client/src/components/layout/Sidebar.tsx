import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useAuth } from "@/hooks/use-auth";
import { Playlist } from "@shared/schema";
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
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const libraryPlaylists = useLibraryStore((state) => state.playlists);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    setPlaylists(libraryPlaylists);
  }, [libraryPlaylists]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const navItems = [
    { icon: Home, label: t('common.home'), path: '/' },
    { icon: Search, label: t('common.search'), path: '/search' },
    { icon: Library, label: t('common.library'), path: '/library' },
    { icon: ShoppingBag, label: t('common.store'), path: '/store' },
    { icon: ShoppingCart, label: t('common.cart'), path: '/cart' },
  ];

  const collectionItems = [
    { icon: Heart, label: t('common.liked'), path: '/library/liked' },
    { icon: Download, label: t('common.downloaded'), path: '/library/downloaded' },
    { icon: ShoppingCart, label: t('common.purchased'), path: '/library/purchased' },
  ];

  return (
    <aside className={cn(
      "w-full md:w-64 bg-background-elevated h-20 md:h-full flex flex-row md:flex-col md:p-4 border-b md:border-r border-gray-800 md:overflow-y-auto scrollbar-hide fixed md:sticky bottom-0 md:top-0 z-10 backdrop-blur-xl shadow-lg",
      className
    )}>
      {/* Mobile Bottom Navigation */}
      <div className="flex md:hidden w-full justify-around items-center bg-background/95 backdrop-blur-lg border-t border-gray-800">
        {navItems.slice(0, 4).map((item) => (
          <div 
            key={item.path}
            className={cn(
              "flex flex-col items-center justify-center py-2 cursor-pointer",
              location === item.path
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => window.location.href = item.path}
          >
            {item.path === '/cart' ? (
              <CartIndicator className="mb-1" />
            ) : (
              <item.icon className="h-5 w-5 mb-1" />
            )}
            <span className="text-xs">{item.label}</span>
          </div>
        ))}
        
        {/* Cart */}
        <div 
          className={cn(
            "flex flex-col items-center justify-center py-2 cursor-pointer",
            location === '/cart'
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => window.location.href = '/cart'}
        >
          <CartIndicator className="mb-1" />
          <span className="text-xs">{t('common.cart')}</span>
        </div>
        
        {/* Language Toggle for Mobile */}
        <div className="flex flex-col items-center justify-center py-2">
          <LanguageToggle className="h-8 w-8 p-0 mb-1" />
          <span className="text-xs">{i18n.language === 'fr' ? 'FR' : 'EN'}</span>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:h-full">
        <div className="mb-8 flex items-center">
          <svg className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="hsl(var(--primary))" strokeWidth="2"/>
            <path d="M9 16.5V7.5L16.5 12L9 16.5Z" fill="hsl(var(--primary))"/>
          </svg>
          <h1 className="text-2xl font-bold">Harmonia</h1>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div 
                key={item.path}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg group cursor-pointer",
                  location === item.path
                    ? "text-white bg-background-highlight"
                    : "text-muted-foreground hover:text-white hover:bg-background-highlight"
                )}
                onClick={() => window.location.href = item.path}
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
            ))}
          </div>

          <div className="mt-8">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('common.yourCollection')}
            </h3>
            <div className="mt-4 space-y-1">
              {collectionItems.map((item) => (
                <div 
                  key={item.path}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-lg cursor-pointer",
                    location === item.path
                      ? "text-white bg-background-highlight"
                      : "text-muted-foreground hover:text-white hover:bg-background-highlight"
                  )}
                  onClick={() => window.location.href = item.path}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('common.playlists')}
            </h3>
            <div className="mt-4 space-y-1">
              <div
                className="flex items-center px-4 py-2 text-muted-foreground hover:text-white hover:bg-background-highlight rounded-lg cursor-pointer"
                onClick={() => window.location.href = "/playlists/create"}
              >
                <Plus className="mr-3 h-4 w-4" />
                <span>{t('common.createPlaylist')}</span>
              </div>
              
              {/* Map through user playlists */}
              {playlists.map((playlist) => (
                <div 
                  key={playlist.id}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-lg cursor-pointer",
                    location === `/playlists/${playlist.id}`
                      ? "text-white bg-background-highlight"
                      : "text-muted-foreground hover:text-white hover:bg-background-highlight"
                  )}
                  onClick={() => window.location.href = `/playlists/${playlist.id}`}
                >
                  <span className="truncate">{playlist.name}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Language Toggle and Subscription upgrade prompt */}
        <div className="mt-auto pt-8 pb-16">
          {/* Language Toggle */}
          <div className="px-4 mb-4 flex justify-start">
            <LanguageToggle />
          </div>
          
          {/* Subscription upgrade prompt */}
          {user && (() => {
            // Check if user has a premium or ultimate subscription
            interface SubscriptionData {
              active: boolean;
              planId?: number;
              userId?: number;
              startDate?: string;
              endDate?: string;
              autoRenew?: boolean;
              paymentMethod?: string;
            }
            
            const { data: userSubscription } = useQuery<SubscriptionData>({
              queryKey: ['/api/me/subscription'],
              enabled: !!user,
            });
            
            const hasPremiumPlan = userSubscription?.planId === 2 || userSubscription?.planId === 3;
            
            // Don't show upgrade prompt for premium users
            if (hasPremiumPlan) {
              return (
                <div className="px-4 py-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">{t('subscription.subscribed')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userSubscription?.planId === 2 ? 'Premium' : 'Ultimate'}
                  </p>
                  <Button 
                    variant="outline"
                    className="mt-2 w-full py-2 px-3 text-sm font-medium rounded-lg"
                    onClick={() => window.location.href = '/subscriptions'}
                  >
                    {t('subscription.manageSubscriptions')}
                  </Button>
                </div>
              );
            }
            
            // Show upgrade prompt for free tier users
            return (
              <div className="px-4 py-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">{t('common.premium')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('common.upgrade')}</p>
                <Button 
                  variant="default"
                  className="mt-2 w-full py-2 px-3 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg"
                  onClick={() => window.location.href = '/subscriptions'}
                >
                  {t('common.upgradeNow')}
                </Button>
              </div>
            );
          })()}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
