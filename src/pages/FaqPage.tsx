import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import FullscreenLoader from '@/components/FullscreenLoader';
import { Helmet } from 'react-helmet-async';
import { Search } from 'lucide-react';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('site_name').maybeSingle().then(({ data }) => {
      setSiteName((data as any)?.site_name ?? 'My Community');
    });
    supabase.from('faqs').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setFaqs(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <FullscreenLoader />;

  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))];
  const filtered = faqs.filter((f) => {
    if (search && !f.question.toLowerCase().includes(search.toLowerCase()) && !f.answer.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && f.category !== catFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>FAQ — {siteName}</title>
        <meta name="description" content={`Frequently asked questions about ${siteName}`} />
        <meta property="og:title" content={`FAQ — ${siteName}`} />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search FAQ..." className="pl-9" />
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={catFilter === null ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCatFilter(null)}>All</Badge>
            {categories.map((c) => (
              <Badge key={c} variant={catFilter === c ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCatFilter(c)}>{c}</Badge>
            ))}
          </div>
        )}
        <Accordion type="multiple" className="w-full">
          {filtered.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent>
                <div className="prose prose-invert prose-sm max-w-none text-foreground/80" dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\n/g, '<br />') }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No FAQs found.</p>}
      </div>
    </div>
  );
}
