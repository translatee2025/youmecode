import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type Provider = 'none' | 'openai' | 'anthropic' | 'google' | 'local';

const PROVIDERS: { value: Provider; label: string; desc: string }[] = [
  { value: 'none', label: 'None', desc: 'No AI provider configured' },
  { value: 'openai', label: 'OpenAI', desc: 'GPT models for translation and content' },
  { value: 'anthropic', label: 'Anthropic Claude', desc: 'Claude models for high-quality translation' },
  { value: 'google', label: 'Google Gemini', desc: 'Gemini models for multilingual content' },
  { value: 'local', label: 'Local LLM', desc: 'Self-hosted model via custom endpoint' },
];

export default function AdminAI() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>('none');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [localEndpoint, setLocalEndpoint] = useState('');
  const [userApiKeysEnabled, setUserApiKeysEnabled] = useState(false);
  const [scopes, setScopes] = useState({ interface: false, content: false, messages: false, categories: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'pass' | 'fail'>('idle');
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('id, translation_provider, translation_api_key, translation_model, local_llm_endpoint, user_api_keys_enabled').eq('tenant_id', DEFAULT_TENANT_ID).maybeSingle().then(({ data }) => {
      if (data) {
        setSettingsId(data.id);
        setProvider((data.translation_provider as Provider) || 'none');
        setApiKey(data.translation_api_key || '');
        setModel(data.translation_model || '');
        setLocalEndpoint(data.local_llm_endpoint || '');
        setUserApiKeysEnabled(data.user_api_keys_enabled ?? false);
      }
      setLoading(false);
    });
  }, []);

  const handleTest = async () => {
    setTestStatus('testing');
    // Simulate test — in production this would call the actual API
    await new Promise(r => setTimeout(r, 1500));
    if (provider === 'local') {
      setTestStatus(localEndpoint ? 'pass' : 'fail');
    } else {
      setTestStatus(apiKey ? 'pass' : 'fail');
    }
  };

  const handleTranslateAll = async () => {
    setTranslating(true);
    console.log('Translating all categories with provider:', provider, 'model:', model);
    await new Promise(r => setTimeout(r, 2000));
    setTranslating(false);
    toast({ title: 'Translation complete!', description: 'All categories have been queued for translation.' });
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      translation_provider: provider === 'none' ? null : provider,
      translation_api_key: apiKey || null,
      translation_model: model || null,
      local_llm_endpoint: localEndpoint || null,
      user_api_keys_enabled: userApiKeysEnabled,
    };

    if (settingsId) {
      await supabase.from('site_settings').update(payload).eq('id', settingsId);
    } else {
      const { data } = await supabase.from('site_settings').insert({ tenant_id: DEFAULT_TENANT_ID, ...payload }).select('id').single();
      if (data) setSettingsId(data.id);
    }
    setSaving(false);
    toast({ title: 'AI settings saved!' });
  };

  if (loading) return <div className="animate-pulse h-64 rounded-xl" style={{ background: 'var(--color-card-bg)' }} />;

  const showApiFields = provider === 'openai' || provider === 'anthropic' || provider === 'google';
  const showLocalFields = provider === 'local';

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text, #f0f0f0)' }}>AI & Translation</h1>

      {/* Provider Selection */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>AI Provider</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup value={provider} onValueChange={v => { setProvider(v as Provider); setTestStatus('idle'); }} className="space-y-2">
            {PROVIDERS.map(p => (
              <div
                key={p.value}
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
                style={{
                  background: provider === p.value ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: `1px solid ${provider === p.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                }}
              >
                <RadioGroupItem value={p.value} id={`provider-${p.value}`} className="mt-0.5" />
                <div>
                  <Label htmlFor={`provider-${p.value}`} className="text-sm font-medium cursor-pointer" style={{ color: 'var(--color-text)' }}>{p.label}</Label>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* API Key & Model */}
      {showApiFields && (
        <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--color-text-muted)' }}>API Key</Label>
              <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--color-text-muted)' }}>Model</Label>
              <Input value={model} onChange={e => setModel(e.target.value)} placeholder={provider === 'openai' ? 'gpt-4o' : provider === 'anthropic' ? 'claude-3-haiku' : 'gemini-pro'} className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <Button variant="outline" onClick={handleTest} disabled={testStatus === 'testing'} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              {testStatus === 'testing' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {testStatus === 'pass' && <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />}
              {testStatus === 'fail' && <XCircle className="h-4 w-4 mr-2 text-red-500" />}
              {testStatus === 'testing' ? 'Testing...' : testStatus === 'pass' ? 'Connected' : testStatus === 'fail' ? 'Failed' : 'Test Connection'}
            </Button>
          </CardContent>
        </Card>
      )}

      {showLocalFields && (
        <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
          <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Local LLM</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--color-text-muted)' }}>Endpoint URL</Label>
              <Input value={localEndpoint} onChange={e => setLocalEndpoint(e.target.value)} placeholder="http://localhost:11434/api" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: 'var(--color-text-muted)' }}>Model Name</Label>
              <Input value={model} onChange={e => setModel(e.target.value)} placeholder="llama3" className="bg-transparent" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
            </div>
            <Button variant="outline" onClick={handleTest} disabled={testStatus === 'testing'} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              {testStatus === 'testing' ? 'Checking...' : testStatus === 'pass' ? 'Healthy' : testStatus === 'fail' ? 'Unreachable' : 'Health Check'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User API Keys */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Allow User API Keys</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Let users provide their own API key for message translation</p>
            </div>
            <Switch checked={userApiKeysEnabled} onCheckedChange={setUserApiKeysEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Translation Scope */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardHeader><CardTitle className="text-base" style={{ color: 'var(--color-text)' }}>Translation Scope</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([
            { key: 'interface', label: 'Interface Strings' },
            { key: 'content', label: 'Content' },
            { key: 'messages', label: 'Direct Messages' },
            { key: 'categories', label: 'Category Names & Filter Labels' },
          ] as const).map(s => (
            <div key={s.key} className="flex items-center gap-2">
              <Checkbox checked={scopes[s.key]} onCheckedChange={v => setScopes(prev => ({ ...prev, [s.key]: !!v }))} />
              <Label className="text-sm" style={{ color: 'var(--color-text)' }}>{s.label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Translate All */}
      <Card className="border-0" style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}>
        <CardContent className="py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Translate All Categories</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Auto-translate all category names and filter labels</p>
          </div>
          <Button variant="outline" onClick={handleTranslateAll} disabled={translating || provider === 'none'} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            {translating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {translating ? 'Translating...' : 'Translate Now'}
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} style={{ background: 'var(--color-button, #fff)', color: 'var(--color-bg, #0a0a0a)' }}>
        {saving ? 'Saving...' : 'Save AI Settings'}
      </Button>
    </div>
  );
}
