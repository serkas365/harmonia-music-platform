import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { Link } from "wouter";

interface Collaboration {
  id: number;
  artistId: number;
  name: string;
  imageUrl: string;
  trackTitle: string;
  trackId: number;
}

interface FeaturedArtistsProps {
  collaborations: Collaboration[];
}

const FeaturedArtists = ({ collaborations }: FeaturedArtistsProps) => {
  const { t } = useTranslation();

  if (!collaborations || collaborations.length === 0) {
    return null;
  }

  return (
    <section className="bg-background-elevated rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('artist.featuredWith')}</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {collaborations.map(collab => (
          <Link key={collab.id} href={`/artists/${collab.artistId}`}>
            <div className="group cursor-pointer">
              <div className="aspect-square rounded-lg overflow-hidden mb-2">
                <img 
                  src={collab.imageUrl} 
                  alt={collab.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-medium text-sm">{collab.name}</h3>
              <p className="text-xs text-muted-foreground">{collab.trackTitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FeaturedArtists;