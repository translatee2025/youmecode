export default function TenantNotFound() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold" style={{ color: '#f0f0f0' }}>Platform Not Found</h1>
        <p style={{ color: '#888' }}>
          The platform you're looking for doesn't exist or hasn't been set up yet.
        </p>
        <p className="text-sm" style={{ color: '#555' }}>
          If you're a developer, add <code className="px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>?tenant=your-subdomain</code> to the URL.
        </p>
      </div>
    </div>
  );
}
