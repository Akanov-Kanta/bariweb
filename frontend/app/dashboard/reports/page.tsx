'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Download, AlertCircle } from 'lucide-react';
import { Organizations } from '@/lib/api/sdk.gen';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [hasClients, setHasClients] = useState(false);
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.reports;

  useEffect(() => {
    const checkClients = async () => {
      try {
        const response = await Organizations.getMyClients();
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setHasClients(true);
        }
      } catch (error) {
        console.error('Failed to check clients:', error);
      } finally {
        setLoading(false);
      }
    };
    checkClients();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white italic">{t.title}</h2>
        <p className="text-zinc-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            {t.historyTitle}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t.historyDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center p-12">
          {loading ? (
            <div className="space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm text-zinc-500 font-mono">{t.scanning}</p>
            </div>
          ) : !hasClients ? (
            <div className="space-y-6">
              <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-zinc-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">{t.noSites}</h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                  {t.noSitesDesc}
                </p>
              </div>
              <Button asChild variant="glow">
                <a href="/dashboard/integration">{t.startIntegration}</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-blue-500 animate-[spin_3s_linear_infinite]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">{t.generating}</h3>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                  {t.generatingDesc}
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" disabled className="border-zinc-800">
                  <Download className="h-4 w-4 mr-2" /> {t.pdfReport}
                </Button>
                <Button variant="outline" disabled className="border-zinc-800">
                  <Download className="h-4 w-4 mr-2" /> {t.jsonExport}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl border-dashed opacity-50">
        <CardContent className="py-6">
          <p className="text-xs text-center text-zinc-500 font-mono italic">
            {t.secureAuditLog}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
