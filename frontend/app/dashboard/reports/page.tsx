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
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-2">{t.title}</h2>
        <p className="text-zinc-400 text-lg">
          {t.subtitle}
        </p>
      </div>

      <Card className="dashboard-card group">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3 text-xl font-bold tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-lime-400" />
            </div>
            {t.historyTitle}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t.historyDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex flex-col items-center justify-center text-center p-12">
          {loading ? (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-t-2 border-lime-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.3em]">{t.scanning}</p>
            </div>
          ) : !hasClients ? (
            <div className="space-y-8">
              <div className="h-24 w-24 rounded-3xl bg-zinc-900 border border-[#1f1f23] flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden">
                <AlertCircle className="h-10 w-10 text-zinc-700" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">{t.noSites}</h3>
                <p className="text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  {t.noSitesDesc}
                </p>
              </div>
              <Button asChild className="dashboard-btn-primary h-12 px-8">
                <a href="/dashboard/integration">{t.startIntegration}</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-8 w-full max-w-md">
              <div className="relative h-2 w-full bg-zinc-900 border border-[#1f1f23] rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-lime-400 w-1/3 shadow-[0_0_15px_rgba(200,255,0,0.5)] animate-[loading_2s_ease-in-out_infinite]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">{t.generating}</h3>
                <p className="text-zinc-500 leading-relaxed italic">
                  {t.generatingDesc}
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" disabled className="border-[#1f1f23] bg-zinc-900/50 text-zinc-600 rounded-xl px-6">
                  <Download className="h-4 w-4 mr-2" /> {t.pdfReport}
                </Button>
                <Button variant="outline" disabled className="border-[#1f1f23] bg-zinc-900/50 text-zinc-600 rounded-xl px-6">
                  <Download className="h-4 w-4 mr-2" /> {t.jsonExport}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="dashboard-card border-dashed opacity-40 hover:opacity-100 transition-opacity">
        <CardContent className="py-8">
          <p className="text-[10px] text-center text-zinc-600 font-bold uppercase tracking-[0.4em]">
            {t.secureAuditLog}
          </p>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes loading {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
