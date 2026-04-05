'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  CircleNotch, 
  DownloadSimple, 
  WarningCircle, 
  ShieldCheck, 
  ChartBar, 
  CheckCircle,
  Eye,
  MagnifyingGlass,
  Code
} from '@phosphor-icons/react';
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
    <div className="space-y-10 max-w-6xl pb-20">
      {/* Header with quick stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">{t.title}</h2>
          <p className="text-zinc-500 text-lg max-w-2xl">
            {t.subtitle} {t.reportsSubDesc}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
           <div className="px-4 py-2 text-center">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.totalAudits}</p>
              <p className="text-xl font-bold text-white">0</p>
           </div>
           <div className="w-px h-8 bg-zinc-800" />
           <div className="px-4 py-2 text-center">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.avgScore}</p>
              <p className="text-xl font-bold text-lime-400">--</p>
           </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Status / History */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/60 overflow-hidden min-h-[500px] flex flex-col">
            <CardHeader className="border-b border-zinc-800 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
                    <ChartBar weight="thin" className="h-6 w-6 text-lime-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg font-bold">{t.historyTitle}</CardTitle>
                    <CardDescription className="text-xs text-zinc-500">{t.historyDesc}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-lime-400/5 blur-[100px] rounded-full pointer-events-none" />

              {loading ? (
                <div className="space-y-6">
                  <div className="relative">
                    <CircleNotch className="w-20 h-20 text-lime-400 animate-spin" weight="thin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 font-black uppercase tracking-[0.3em]">{t.scanning}</p>
                </div>
              ) : !hasClients ? (
                <div className="space-y-8 max-w-sm">
                  <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto relative group">
                     <MagnifyingGlass weight="thin" className="w-10 h-10 text-zinc-700 group-hover:text-lime-400 transition-colors" />
                     <div className="absolute inset-0 bg-lime-400/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white">{t.noSites}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      {t.noSitesDesc} {t.noSitesHint}
                    </p>
                  </div>
                  <Button asChild className="dashboard-btn-primary h-12 px-8 rounded-xl bg-lime-400 text-black font-bold">
                    <a href="/dashboard/integration">{t.startIntegration}</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 w-full max-w-md">
                   {/* Progress Visual */}
                   <div className="relative h-2 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-lime-400 w-1/3 shadow-[0_0_20px_rgba(200,255,0,0.4)] animate-[loading_2.5s_infinite_ease-in-out]" />
                   </div>
                   <div className="space-y-3">
                     <h3 className="text-2xl font-black text-white">{t.generating}</h3>
                     <p className="text-zinc-500 leading-relaxed italic text-sm">
                       {t.generatingDesc} {t.generatingSubDesc}
                     </p>
                   </div>
                   <div className="flex gap-4 justify-center">
                     <Button variant="outline" disabled className="border-zinc-800 bg-zinc-900/50 text-zinc-600 rounded-xl px-6 h-11 text-xs font-bold uppercase tracking-widest">
                       <DownloadSimple weight="thin" className="h-5 w-5 mr-3" /> PDF
                     </Button>
                     <Button variant="outline" disabled className="border-zinc-800 bg-zinc-900/50 text-zinc-600 rounded-xl px-6 h-11 text-xs font-bold uppercase tracking-widest">
                       <DownloadSimple weight="thin" className="h-5 w-5 mr-3" /> JSON
                     </Button>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Analysis Grid */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="dashboard-card border-zinc-800 bg-zinc-900/20 p-8">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">{t.componentAnalysis}</h3>
              <div className="space-y-6">
                 {[
                   { label: t.colorContrast, icon: Eye, color: 'text-blue-400' },
                   { label: t.ariaAttributes, icon: Code, color: 'text-purple-400' },
                   { label: t.keyboardNav, icon: ChartBar, color: 'text-amber-400' },
                   { label: t.textReadability, icon: FileText, color: 'text-emerald-400' }
                 ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg bg-white/5 border border-white/5 ${item.color}`}>
                             <item.icon weight="thin" className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">{item.label}</span>
                       </div>
                       <div className="w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-zinc-600 transition-colors" />
                    </div>
                 ))}
              </div>
           </Card>

           <Card className="dashboard-card border-lime-400/20 bg-lime-400/[0.02] p-8 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-lime-400/20 border-t-lime-400 flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck weight="thin" className="w-8 h-8 text-lime-400" />
              </div>
              <h4 className="text-white font-bold mb-2">{t.complianceTitle}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {t.complianceDesc}
              </p>
           </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
