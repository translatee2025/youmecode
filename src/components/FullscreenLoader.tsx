export default function FullscreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--color-bg, #0a0a0a)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm" style={{ color: 'var(--color-text-muted, #888)' }}>Loading platform...</p>
      </div>
    </div>
  );
}
