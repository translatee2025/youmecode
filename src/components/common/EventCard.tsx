import { Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Props {
  event: any;
}

export default function EventCard({ event }: Props) {
  return (
    <div className="glass overflow-hidden cursor-pointer hover:scale-[1.01] transition-all">
      {event.cover_image_url && (
        <img src={event.cover_image_url} alt={event.title} className="w-full aspect-video object-cover" loading="lazy" />
      )}
      <div className="p-3.5 space-y-2">
        <h3 className="font-semibold text-sm text-foreground truncate">{event.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {event.start_at ? format(new Date(event.start_at), 'MMM d, yyyy · h:mm a') : 'TBD'}
        </div>
        {event.address && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{event.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {event.is_free ? (
            <Badge variant="secondary" className="text-[10px]">Free</Badge>
          ) : event.price ? (
            <Badge variant="secondary" className="text-[10px]">{event.currency ?? '$'}{event.price}</Badge>
          ) : null}
          <Badge variant="outline" className="text-[10px]">{event.status ?? 'upcoming'}</Badge>
        </div>
      </div>
    </div>
  );
}
