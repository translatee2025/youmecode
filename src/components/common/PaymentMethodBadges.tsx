import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Banknote, Bitcoin, CreditCard, DollarSign, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons: Record<string, any> = {
  cash: Banknote,
  crypto: Bitcoin,
  credit_card: CreditCard,
  paypal: DollarSign,
  third_party: ExternalLink,
};

const labels: Record<string, string> = {
  cash: 'Cash',
  crypto: 'Crypto',
  credit_card: 'Credit Card',
  paypal: 'PayPal',
  third_party: 'Third Party',
};

interface Props {
  methods: string[];
  className?: string;
}

export default function PaymentMethodBadges({ methods, className }: Props) {
  if (!methods || methods.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {methods.map((m) => {
        const Icon = icons[m] ?? DollarSign;
        return (
          <Tooltip key={m}>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs gap-1 cursor-default">
                <Icon className="h-3 w-3" />
                {labels[m] ?? m}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Contact vendor directly to arrange payment</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
