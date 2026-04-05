'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { Organizations } from '@/lib/api/sdk.gen';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';

interface ClientData {
  id: string;
  public_id: string;
  name: string;
  allowed_domains: string;
}

export default function IntegrationPage() {
  const [copied, setCopied] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.integration;

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await Organizations.getMyClients();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const fetchedClients = res.data as ClientData[];
          setClients(fetchedClients);
          setSelectedClientId(fetchedClients[0].public_id);
        }
      } catch (err) {
        console.error('Failed to fetch clients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const integrationCode = selectedClientId 
    ? `<script src="https://widget.bariweb.org/bariweb.js" data-client-id="${selectedClientId}"></script>`
    : t.noDomainWarning;

  const copyToClipboard = () => {
    if (!selectedClientId) return;
    navigator.clipboard.writeText(integrationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-2">{t.title}</h2>
        <p className="text-zinc-400 text-lg">
          {t.subtitle}
        </p>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">{t.step1Title}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t.step1Desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length > 0 && (
            <div className="mb-6">
              <label htmlFor="domain-select" className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">
                {t.selectDomain}
              </label>
              <select
                id="domain-select"
                className="w-full max-w-sm rounded-xl border border-[#1f1f23] bg-black/60 px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-lime-400 transition-all cursor-pointer"
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                {clients.map(c => (
                  <option key={c.public_id} value={c.public_id}>{c.allowed_domains}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative rounded-2xl bg-black/60 border border-[#1f1f23] p-6 font-mono text-sm text-zinc-300 shadow-inner">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#1f1f23]">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{t.htmlLabel}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyToClipboard}
                disabled={!selectedClientId || loading}
                className="h-9 px-4 text-zinc-400 hover:text-lime-400 hover:bg-lime-400/10 rounded-lg transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-lime-400" />
                    <span className="text-lime-400 font-bold">{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {t.copyCode}
                  </>
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto p-2 scrollbar-thin">
              <code className={selectedClientId ? "text-lime-400/90" : "text-zinc-600 italic"}>
                {loading ? t.loading : integrationCode}
              </code>
            </pre>
          </div>
          {!selectedClientId && !loading && (
            <div className="mt-6 flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <p className="text-sm text-amber-500/90 font-medium">
                {t.noDomainWarning}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">{t.step2Title}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t.step2Desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            {t.settingsHint}
          </p>
          <Button className="dashboard-btn-primary" asChild>
            <a href="/dashboard/settings">{t.goToSettings}</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
