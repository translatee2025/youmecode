import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  followeeType: string;
  followeeId: string;
  className?: string;
}

export default function FollowButton({ followeeType, followeeId, className }: Props) {
  const tenant = useTenantStore((s) => s.tenant);
  const profile = useAuthStore((s) => s.profile);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile || !tenant) return;
    supabase
      .from('follows')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('followee_type', followeeType)
      .eq('followee_id', followeeId)
      .eq('follower_id', profile.id)
      .maybeSingle()
      .then(({ data }) => setFollowing(!!data));
  }, [profile, tenant, followeeType, followeeId]);

  const toggle = async () => {
    if (!profile || !tenant) {
      toast({ title: 'Please sign in', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setFollowing(!following);

    if (following) {
      await supabase
        .from('follows')
        .delete()
        .eq('tenant_id', tenant.id)
        .eq('followee_type', followeeType)
        .eq('followee_id', followeeId)
        .eq('follower_id', profile.id);
    } else {
      await supabase.from('follows').insert({
        tenant_id: tenant.id,
        followee_type: followeeType,
        followee_id: followeeId,
        follower_id: profile.id,
      });
    }
    setLoading(false);
  };

  return (
    <Button
      variant={following ? 'secondary' : 'default'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={className}
    >
      {following ? <UserCheck className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
