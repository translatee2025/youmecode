import { MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Props {
  user: any;
  distance?: number | null;
}

export default function UserCard({ user, distance }: Props) {
  return (
    <div className="glass p-4 flex flex-col items-center text-center space-y-2 hover:scale-[1.01] transition-all cursor-pointer">
      <Avatar className="h-16 w-16">
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback className="bg-secondary text-foreground text-lg">
          {(user.display_name ?? user.username ?? '?').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-semibold text-sm text-foreground">{user.display_name ?? user.username}</h3>
        {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
      </div>
      {user.bio && <p className="text-xs text-muted-foreground line-clamp-2">{user.bio}</p>}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {user.follower_count ?? 0}
        </span>
        {user.location_city && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {user.location_city}
          </span>
        )}
        {distance != null && (
          <span className="text-primary font-medium">
            {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
          </span>
        )}
      </div>
      <Button variant="outline" size="sm" className="w-full text-xs mt-1">Follow</Button>
    </div>
  );
}
