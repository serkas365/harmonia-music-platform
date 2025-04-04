import { Artist } from "@shared/schema";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface ArtistCardProps {
  artist: Artist;
  followers?: number;
  className?: string;
}

const ArtistCard = ({ artist, followers, className }: ArtistCardProps) => {
  const { t } = useTranslation();
  
  return (
    <Link href={`/artists/${artist.id}`}>
      <div className={cn("flex-shrink-0 w-32 md:w-40 group cursor-pointer", className)}>
        <div className="relative">
          <div className="aspect-square rounded-full overflow-hidden mb-3">
            <img 
              src={artist.image} 
              alt={artist.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          {artist.verified && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
              <BadgeCheck className="h-4 w-4" />
            </span>
          )}
        </div>
        <h3 className="font-bold text-center text-sm truncate">{artist.name}</h3>
        {followers !== undefined && (
          <p className="text-xs text-muted-foreground text-center">
            {new Intl.NumberFormat().format(followers)} {t('common.followers')}
          </p>
        )}
      </div>
    </Link>
  );
};

export default ArtistCard;
