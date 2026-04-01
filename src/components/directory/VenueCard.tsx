import { Heart, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  venue: any;
  distance?: number | null;
  cardBadgeFields?: { field_key: string; label: string }[];
}

const statusColors: Record<string, string> = {
  claimed_directory: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  claimed_commerce: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  unclaimed: 'bg-muted text-muted-foreground border-border',
  claim_pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  opted_out: 'bg-destructive/20 text-destructive border-destructive/30',
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
    <div
      className={cn(
        'glass group overflow-hidden cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg',
        venue.is_featured && 'ring-1 ring-amber-500/50 shadow-amber-500/10 shadow-lg',
      )}
    >
      {/* Cover */}
      <div className="relative aspect-video overflow-hidden">
        {venue.cover_image_url ? (
          <img
            src={venue.cover_image_url}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground"
            style={{ background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))' }}>
            {venue.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
        <Badge
          variant="outline"
          className={cn('absolute top-2 left-2 text-[10px]', statusColors[status])}
        >
          {statusLabels[status] ?? status}
        </Badge>
        {venue.category_name && (
          <Badge className="absolute top-2 right-2 text-[10px] bg-secondary/80 backdrop-blur-sm border-border">
            {venue.category_icon && <span className="mr-1">{venue.category_icon}</span>}
            {venue.category_name}
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2">
        <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{venue.name}</h3>

        {venue.subcategory_name && (
          <Badge variant="secondary" className="text-[10px]">{venue.subcategory_name}</Badge>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {venue.city && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {venue.city}
            </span>
          )}
          {distance != null && (
            <span className="text-primary font-medium">{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</span>
          )}
        </div>

        {(venue.rating_count ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{(venue.rating_avg ?? 0).toFixed(1)}</span>
            <span className="text-muted-foreground">({venue.rating_count})</span>
          </div>
        )}

        {/* Card badge row */}
        {cardBadgeFields && cardBadgeFields.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cardBadgeFields.map((f) => {
              const val = filterVals[f.field_key];
              if (!val) return null;
              const items = Array.isArray(val) ? val : [val];
              return items.map((item: string) => (
                <Badge
                  key={`${f.field_key}-${item}`}
                  variant="outline"
                  className="text-[10px] bg-secondary/40"
                >
                  {String(item)}
                </Badge>
              ));
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <Heart className="h-3.5 w-3.5" />
            {venue.likes_count ?? 0}
          </button>
          <button className="text-xs text-primary hover:underline">Follow</button>
        </div>
      </div>
    </div>
  );
}
