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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">{t.title}</h2>
        <p className="text-zinc-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.step1Title}</CardTitle>
          <CardDescription>
            {t.step1Desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-mono text-sm text-zinc-300">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800/50">
              <span className="text-zinc-500 text-xs">{t.htmlLabel}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyToClipboard}
                disabled={!clientId || loading}
                className="h-8 text-zinc-400 hover:text-white"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    {t.copied}
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {t.copyCode}
                  </>
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto p-2">
              <code>{loading ? t.loading : integrationCode}</code>
            </pre>
          </div>
          {!clientId && !loading && (
            <p className="mt-4 text-sm text-amber-500 font-medium">
              {t.noDomainWarning}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.step2Title}</CardTitle>
          <CardDescription>
            {t.step2Desc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400 mb-4">
            {t.settingsHint}
          </p>
          <Button variant="outline" asChild>
            <a href="/dashboard/settings">{t.goToSettings}</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
