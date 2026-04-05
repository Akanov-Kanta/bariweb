'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { Organizations } from '@/lib/api/sdk.gen';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';

export default function IntegrationPage() {
  const [copied, setCopied] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.integration;

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await Organizations.getMyClients();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setClientId((res.data[0] as any).public_id);
        }
      } catch (err) {
        console.error('Failed to fetch client', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, []);

  const integrationCode = clientId 
    ? `<script src="https://widget.bariweb.org/bariweb.js" data-client-id="${clientId}"></script>`
    : t.noDomainWarning;

  const copyToClipboard = () => {
    if (!clientId) return;
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
          <div className="relative rounded-2xl bg-black/60 border border-[#1f1f23] p-6 font-mono text-sm text-zinc-300 shadow-inner">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#1f1f23]">
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{t.htmlLabel}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyToClipboard}
                disabled={!clientId || loading}
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
              <code className={clientId ? "text-lime-400/90" : "text-zinc-600 italic"}>
                {loading ? t.loading : integrationCode}
              </code>
            </pre>
          </div>
          {!clientId && !loading && (
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
