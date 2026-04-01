import { Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  url?: string;
  title: string;
  className?: string;
}

export default function ShareButton({ url, title, className }: Props) {
  const effectiveUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: effectiveUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(effectiveUrl);
      toast({ title: 'Link copied to clipboard!' });
    }
  };

  return (
    <button onClick={share} className={className ?? 'text-muted-foreground hover:text-foreground transition-colors'}>
      <Share2 className="h-4 w-4" />
    </button>
  );
}
