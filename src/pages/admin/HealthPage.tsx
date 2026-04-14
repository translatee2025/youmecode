import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, HardDrive, AlertTriangle } from 'lucide-react';

export default function HealthPage() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [latency, setLatency] = useState(0);
  const [errors, setErrors] = useState<any[]>([]);

  useEffect(() => {
    // Check DB connection
    const start = Date.now();
    supabase.from('tenants').select('id').limit(1).then(({ error }) => {
      setLatency(Date.now() - start);
      setDbStatus(error ? 'error' : 'connected');
    });

    // Recent errors from audit log
    if (tenant) {
      supabase.from('audit_log')
        .select('*')
        .ilike('action', '%error%')
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => setErrors(data ?? []));
    }
  }, []);

  const statusColor = dbStatus === 'connected' ? 'text-green-500' : dbStatus === 'error' ? 'text-destructive' : 'text-yellow-500';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Platform Health</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DB status */}
        <Card className="glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Database</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className={`h-4 w-4 ${statusColor}`} />
              <span className={`text-sm font-medium ${statusColor}`}>
                {dbStatus === 'checking' ? 'Checking...' : dbStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {dbStatus === 'connected' && (
              <p className="text-xs text-muted-foreground">Latency: {latency}ms</p>
            )}
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Storage</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Progress value={25} className="h-2" />
            <p className="text-xs text-muted-foreground">Usage info available in backend dashboard</p>
          </CardContent>
        </Card>

        {/* Errors */}
        <Card className="glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Recent Errors</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={errors.length > 0 ? 'destructive' : 'default'}>
              {errors.length} in last 24h
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Error list */}
      {errors.length > 0 && (
        <Card className="glass">
          <CardHeader><CardTitle className="text-base">Error Log</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((e) => (
                <div key={e.id} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{e.action}</p>
                    <p className="text-xs text-muted-foreground">{e.entity_type} · {e.entity_id?.slice(0, 8)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
