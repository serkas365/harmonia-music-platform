import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Playlist } from "@shared/schema";
import { useState, useEffect } from "react";
import { useLibraryStore } from "@/stores/useLibraryStore";
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
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const libraryPlaylists = useLibraryStore((state) => state.playlists);

  useEffect(() => {
    setPlaylists(libraryPlaylists);
  }, [libraryPlaylists]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const navItems = [
    { icon: Home, label: t('common.home'), path: '/' },
    { icon: Search, label: t('common.search'), path: '/search' },
    { icon: Library, label: t('common.library'), path: '/library' },
    { icon: ShoppingBag, label: t('common.store'), path: '/store' },
  ];

  const collectionItems = [
    { icon: Heart, label: t('common.liked'), path: '/library/liked' },
    { icon: Download, label: t('common.downloaded'), path: '/library/downloaded' },
    { icon: ShoppingCart, label: t('common.purchased'), path: '/library/purchased' },
  ];

  return (
    <aside className={cn(
      "w-full md:w-64 bg-background-elevated h-20 md:h-full flex flex-row md:flex-col md:p-4 border-b md:border-r border-gray-800 md:overflow-y-auto scrollbar-hide fixed md:sticky bottom-0 md:top-0 z-10",
      className
    )}>
      {/* Mobile Bottom Navigation */}
      <div className="flex md:hidden w-full justify-around items-center">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a className={cn(
              "flex flex-col items-center justify-center py-2",
              location === item.path
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}>
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </a>
          </Link>
        ))}
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
              <Link key={item.path} href={item.path}>
                <a className={cn(
                  "flex items-center px-4 py-3 rounded-lg group",
                  location === item.path
                    ? "text-white bg-background-highlight"
                    : "text-muted-foreground hover:text-white hover:bg-background-highlight"
                )}>
                  <item.icon className={cn(
                    "mr-3 h-5 w-5",
                    location === item.path
                      ? "text-primary"
                      : "group-hover:text-primary"
                  )} />
                  <span className="font-medium">{item.label}</span>
                </a>
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
                  <a className={cn(
                    "flex items-center px-4 py-2 rounded-lg",
                    location === item.path
                      ? "text-white bg-background-highlight"
                      : "text-muted-foreground hover:text-white hover:bg-background-highlight"
                  )}>
                    <item.icon className="mr-3 h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
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
                <a className="flex items-center px-4 py-2 text-muted-foreground hover:text-white hover:bg-background-highlight rounded-lg">
                  <Plus className="mr-3 h-4 w-4" />
                  <span>{t('common.createPlaylist')}</span>
                </a>
              </Link>
              
              {/* Map through user playlists */}
              {playlists.map((playlist) => (
                <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                  <a className={cn(
                    "flex items-center px-4 py-2 rounded-lg",
                    location === `/playlists/${playlist.id}`
                      ? "text-white bg-background-highlight"
                      : "text-muted-foreground hover:text-white hover:bg-background-highlight"
                  )}>
                    <span className="truncate">{playlist.name}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Subscription upgrade prompt */}
        {user && (
          <div className="mt-auto pt-8">
            <div className="px-4 py-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-primary">{t('common.premium')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('common.upgrade')}</p>
              <Button 
                variant="default"
                className="mt-2 w-full py-2 px-3 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg"
              >
                {t('common.upgradeNow')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
