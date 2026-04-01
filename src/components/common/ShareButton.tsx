import { Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  url: string;
  title: string;
  className?: string;
}

export default function ShareButton({ url, title, className }: Props) {
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard!' });
    }
  };

  return (
    <button onClick={share} className={className ?? 'text-muted-foreground hover:text-foreground transition-colors'}>
      <Share2 className="h-4 w-4" />
    </button>
  );
}
