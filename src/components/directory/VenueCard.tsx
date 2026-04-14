import { Heart, MapPin, Star, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Props {
  venue: any;
  distance?: number | null;
  cardBadgeFields?: { field_key: string; label: string }[];
}

const statusColors: Record<string, string> = {
  claimed_directory: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  claimed_commerce: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  unclaimed: 'bg-muted text-muted-foreground border-border',
  claim_pending: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  opted_out: 'bg-destructive/15 text-destructive border-destructive/25',
};

const statusLabels: Record<string, string> = {
  claimed_directory: 'Verified',
  claimed_commerce: 'Verified',
  unclaimed: 'Unclaimed',
  claim_pending: 'Pending',
};

export default function VenueCard({ venue, distance, cardBadgeFields }: Props) {
  const status = venue.status ?? 'unclaimed';
  const filterVals: Record<string, any> = venue.filter_values ?? {};

  return (
    <Link to={`/venues/${venue.slug}`}>
      <div
        className={cn(
          'group overflow-hidden rounded-2xl border border-border bg-card cursor-pointer transition-all duration-300 hover:border-foreground/20 hover:shadow-xl hover:shadow-black/20',
          venue.is_featured && 'ring-1 ring-amber-500/30',
        )}
      >
        {/* Cover */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {venue.cover_image_url ? (
            <img
              src={venue.cover_image_url}
              alt={venue.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-muted-foreground bg-secondary">
              {venue.name?.charAt(0)?.toUpperCase()}
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <Badge
            variant="outline"
            className={cn('absolute top-3 left-3 text-xs font-medium px-2.5 py-1 backdrop-blur-sm', statusColors[status])}
          >
            {statusLabels[status] ?? status}
          </Badge>

          {/* Bottom overlay info */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-semibold text-white text-base leading-tight drop-shadow-md truncate">{venue.name}</h3>
            {(venue.location_city || venue.address) && (
              <p className="flex items-center gap-1.5 text-white/80 text-sm mt-1 drop-shadow-sm">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{venue.location_city || venue.address}</span>
                {distance != null && (
                  <span className="ml-auto text-white font-medium text-xs shrink-0">
                    {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            {(venue.rating_count ?? 0) > 0 ? (
              <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground text-sm">{(venue.rating_avg ?? 0).toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">({venue.rating_count})</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">No reviews yet</span>
            )}
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>

          {venue.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{venue.short_description}</p>
          )}

          {/* Card badge row */}
          {cardBadgeFields && cardBadgeFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cardBadgeFields.map((f) => {
                const val = filterVals[f.field_key];
                if (!val) return null;
                const items = Array.isArray(val) ? val : [val];
                return items.map((item: string) => (
                  <Badge
                    key={`${f.field_key}-${item}`}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {String(item)}
                  </Badge>
                ));
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <button
              onClick={(e) => { e.preventDefault(); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Heart className="h-5 w-5" />
              <span>{venue.likes_count ?? 0}</span>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); }}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Follow
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
