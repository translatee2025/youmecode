import { DEFAULT_TENANT_ID } from '@/config';
import { supabase } from '@/integrations/supabase/client';

export async function checkBadges(
  userId: string,
  triggerType: string,
  value: number
) {
  const { data: badges } = await supabase
    .from('badges')
    .select('id, name')
    .eq('trigger_type', triggerType)
    .eq('is_active', true)
    .lte('trigger_threshold', value);

  if (!badges?.length) return;

  const { data: earned } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedIds = new Set((earned ?? []).map((e: any) => e.badge_id));

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    await supabase.from('user_badges').insert({ tenant_id: DEFAULT_TENANT_ID, tenant_id: DEFAULT_TENANT_ID,
      user_id: userId,
      badge_id: badge.id,
    });

    await supabase.from('notifications').insert({ tenant_id: DEFAULT_TENANT_ID,
      user_id: userId,
      type: 'badge_earned',
      message: `You earned the "${badge.name}" badge!`,
      entity_type: 'badge',
      entity_id: badge.id,
    });
  }
}

export async function createNotification(
  userId: string,
  type: string,
  message: string,
  entityType?: string,
  entityId?: string
) {
  await supabase.from('notifications').insert({ tenant_id: DEFAULT_TENANT_ID, tenant_id: DEFAULT_TENANT_ID,
    user_id: userId,
    type,
    message,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
  });
}
