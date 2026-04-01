export default function AdminPlaceholder({ title }: { title?: string }) {
  return (
    <div
      className="flex items-center justify-center h-64 rounded-2xl"
      style={{
        background: 'var(--color-card-bg, rgba(255,255,255,0.06))',
        border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
      }}
    >
      <div className="text-center space-y-2">
        <h2
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text, #f0f0f0)' }}
        >
          {title || 'Coming Soon'}
        </h2>
        <p style={{ color: 'var(--color-text-muted, #888)' }} className="text-sm">
          This section is under construction.
        </p>
      </div>
    </div>
  );
}
