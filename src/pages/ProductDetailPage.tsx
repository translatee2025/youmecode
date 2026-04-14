import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LikeButton from '@/components/common/LikeButton';
import RatingDisplay from '@/components/common/RatingDisplay';
import CommentSection from '@/components/common/CommentSection';
import DynamicFilterValues from '@/components/common/DynamicFilterValues';
import PaymentMethodBadges from '@/components/common/PaymentMethodBadges';
import FullscreenLoader from '@/components/FullscreenLoader';
import { ExternalLink, MessageCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [prodRes, settingsRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).maybeSingle(),
        supabase.from('site_settings').select('*').maybeSingle(),
      ]);
      const p = prodRes.data;
      if (!p) { setLoading(false); return; }
      setProduct(p);
      setSiteSettings(settingsRes.data);

      if (p.venue_id) {
        const { data: v } = await supabase.from('venues' as any).select('id, name, slug, owner_id').eq('id', p.venue_id).maybeSingle();
        setVenue(v);

        const { data: rel } = await supabase.from('products').select('*').eq('venue_id', p.venue_id)
          .neq('id', p.id).eq('status', 'active').limit(6);
        setRelated(rel ?? []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <FullscreenLoader />;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Product not found</div>;

  const images: string[] = Array.isArray(product.images) ? product.images : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            {images.length > 0 ? (
              <div className="space-y-2">
                <div className="aspect-square rounded-xl overflow-hidden cursor-pointer" onClick={() => setGalleryIndex(0)}>
                  <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.slice(1).map((img: string, i: number) => (
                      <button key={i} onClick={() => setGalleryIndex(i + 1)} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 hover:opacity-80">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square rounded-xl flex items-center justify-center text-4xl font-bold text-muted-foreground/30" style={{ background: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))' }}>
                {product.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            {product.product_type_id && <Badge variant="secondary" className="text-xs">Product</Badge>}

            {venue && (
              <Link to={`/venues/${venue.slug}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                {venue.name}
              </Link>
            )}

            {siteSettings?.commerce_enabled && product.price != null && (
              <div className="text-2xl font-bold text-foreground">{product.currency ?? '$'}{product.price}{product.price_unit ? `/${product.price_unit}` : ''}</div>
            )}

            {product.description && <p className="text-sm text-foreground/90 whitespace-pre-line">{product.description}</p>}

            <DynamicFilterValues filterValues={product.filter_values} categoryId={product.category_id} />
            <PaymentMethodBadges methods={(product.payment_methods as string[]) ?? []} />

            <div className="flex items-center gap-3">
              <LikeButton entityType="product" entityId={product.id} initialCount={product.likes_count ?? 0} />
              {product.external_link && (
                <Button variant="outline" size="sm" asChild>
                  <a href={product.external_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" /> View</a>
                </Button>
              )}
              {venue?.owner_id && (
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-3.5 w-3.5 mr-1" /> Contact Vendor
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Ratings & Comments */}
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Reviews</h2>
            <RatingDisplay entityType="product" entityId={product.id} showForm />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Comments</h2>
            <CommentSection entityType="product" entityId={product.id} />
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Related Products</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {related.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="glass overflow-hidden w-48 shrink-0 hover:scale-[1.02] transition-all">
                  {(p.images as any[])?.[0] && <img src={(p.images as any[])[0]} alt={p.name} className="w-full aspect-square object-cover" loading="lazy" />}
                  <div className="p-2.5">
                    <h4 className="text-xs font-semibold truncate">{p.name}</h4>
                    {p.price != null && <span className="text-xs text-foreground">{p.currency ?? '$'}{p.price}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {galleryIndex !== null && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center" onClick={() => setGalleryIndex(null)}>
          <button className="absolute top-4 right-4 text-foreground"><X className="h-6 w-6" /></button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground" onClick={(e) => { e.stopPropagation(); setGalleryIndex(Math.max(0, galleryIndex - 1)); }}><ChevronLeft className="h-8 w-8" /></button>
          <img src={images[galleryIndex]} alt="" className="max-h-[85vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground" onClick={(e) => { e.stopPropagation(); setGalleryIndex(Math.min(images.length - 1, galleryIndex + 1)); }}><ChevronRight className="h-8 w-8" /></button>
        </div>
      )}
    </div>
  );
}
