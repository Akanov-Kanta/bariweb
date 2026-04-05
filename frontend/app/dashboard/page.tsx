'use client';

import { useState, useEffect } from 'react';
import { Auth, Organizations } from '@/lib/api/sdk.gen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Pulse, 
  Users, 
  ShieldCheck, 
  Lightning, 
  ArrowRight, 
  Globe, 
  CheckCircle, 
  WarningCircle, 
  Clock,
  CaretRight
} from '@phosphor-icons/react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';
import Link from 'next/link';

export default function DashboardOverview() {
  const [userData, setUserData] = useState<any>(null);
  const [clientsCount, setClientsCount] = useState(0);
  const [isIntegrated, setIsIntegrated] = useState(false);
  const [metrics, setMetrics] = useState<any>({ totalCost: 0, totalTokens: 0, totalTraces: 0, details: [] });
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.overview;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, clientsRes, metricsRes] = await Promise.all([
          Auth.me(),
          Organizations.getMyClients(),
          Organizations.getMyMetrics()
        ]);

        if (!userRes.error) {
          setUserData(userRes.data);
        }
        
        if (!clientsRes.error && Array.isArray(clientsRes.data)) {
          setClientsCount(clientsRes.data.length);
          setIsIntegrated(clientsRes.data.length > 0);
        }
        
        if (!metricsRes.error && metricsRes.data) {
          setMetrics(metricsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      title: t.activeIntegrations || 'Active Integrations',
      value: clientsCount.toString(),
      icon: Globe,
      color: 'text-lime-400',
      bg: 'bg-lime-400/5',
    },
    {
      title: 'Widget Sessions',
      value: metrics.totalTraces.toString(),
      icon: Users,
      color: 'text-zinc-400',
      bg: 'bg-zinc-400/5',
    },

    {
      title: 'Total Spent',
      value: `$${metrics.totalCost.toFixed(4)}`,
      icon: ShieldCheck,
      color: 'text-lime-400',
      bg: 'bg-lime-400/5',
    },
  ];

  const onboardingSteps = [
    { id: 1, title: t.stepAddDomain, desc: t.stepAddDomainDesc, completed: clientsCount > 0, href: '/dashboard/settings' },
    { id: 2, title: t.stepInstallScript, desc: t.stepInstallScriptDesc, completed: false, href: '/dashboard/integration' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Pulse className="w-8 h-8 text-lime-400 animate-pulse" weight="thin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <span className="px-2 py-0.5 rounded-md bg-lime-400/10 text-[10px] font-black text-lime-400 uppercase tracking-widest border border-lime-400/20">{t.systemOnline}</span>
             <div className="w-1 h-1 rounded-full bg-lime-400" />
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">v1.0.4 r2</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">
            {t.welcome}, <span className="text-lime-400">{userData?.email?.split('@')[0]}</span>
          </h2>
          <p className="text-zinc-500 font-medium max-w-lg">
            {t.dashboardModeDesc}
          </p>
        </div>
        
        <Link href="/dashboard/settings">
          <button className="dashboard-btn-primary flex items-center gap-2 group bg-lime-400 text-black px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-lime-500 transition-colors">
            {t.addSite} <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Statistics Columns */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/40 group hover:border-lime-400/30 transition-all duration-500 overflow-hidden min-h-[190px] flex flex-col p-6">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/5 blur-[50px] -mr-16 -mt-16 pointer-events-none group-hover:bg-lime-400/10 transition-colors" />
                
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${stat.bg} border border-zinc-800/40 flex items-center justify-center mb-auto transition-all duration-500 group-hover:scale-110 group-hover:border-lime-400/20 group-hover:shadow-[0_0_30px_rgba(200,255,0,0.15)]`}>
                  <stat.icon weight="fill" className={`h-8 w-8 ${stat.color} filter drop-shadow-[0_0_12px_rgba(200,255,0,0.4)]`} />
                </div>
                
                <div className="mt-8">
                  <p className="text-[13px] font-bold text-white mb-2 group-hover:translate-x-1 transition-transform duration-300">
                    {stat.title}
                  </p>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-black text-lime-400 tracking-tighter transition-all group-hover:text-white">
                      {stat.value}
                    </span>
                    {stat.value !== '0' && stat.value !== 'N/A' && (
                      <div className="relative flex h-3 w-3 mb-1.5 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-400 shadow-[0_0_10px_#c8ff00]"></span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Large Main View: Domain Metrics */}
          <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/60 overflow-hidden relative group">
            <CardHeader className="border-b border-zinc-800 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-white mb-1">Токены по доменам</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Детализация использования ИИ</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col p-6">
              {!metrics.details || metrics.details.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-center">
                  <h4 className="text-zinc-500 italic text-sm font-medium mb-2">{t.waitingForData || 'Ожидание данных...'}</h4>
                  <p className="text-zinc-600 text-xs max-w-xs">{t.integrationRequiredDesc}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.details.map((detail: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{detail.domain}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{detail.traces} сессий</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[17px] font-black text-lime-400 font-mono">${Number(detail.cost || 0).toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Checklist Column */}
        <div className="lg:col-span-4 space-y-8">
           {/* Steps Card */}
           <Card className="dashboard-card border-lime-400/20 bg-lime-400/[0.02] overflow-hidden">
             <div className="bg-lime-400/10 px-6 py-4 border-b border-lime-400/10">
                <h3 className="text-sm font-black text-lime-400 uppercase tracking-[0.2em]">{t.nextSteps}</h3>
             </div>
             <CardContent className="p-0">
               <div className="divide-y divide-zinc-800/30">
                 {onboardingSteps.map((step) => (
                   <Link key={step.id} href={step.href}>
                     <div className="group p-6 hover:bg-lime-400/[0.03] transition-colors relative">
                        <div className="flex items-start gap-4">
                           <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                             step.completed 
                             ? "bg-lime-400 border-lime-400 text-black shadow-[0_0_15px_rgba(200,255,0,0.3)]" 
                             : "border-zinc-800 text-zinc-600 group-hover:border-zinc-500"
                           }`}>
                             {step.completed ? <CheckCircle weight="bold" className="h-4 w-4" /> : <span className="text-[10px] font-black">{step.id}</span>}
                           </div>
                           <div className="flex-1">
                             <h4 className={`text-sm font-bold transition-colors ${step.completed ? 'text-zinc-400' : 'text-zinc-200 group-hover:text-lime-400'}`}>
                               {step.title}
                             </h4>
                             <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{step.desc}</p>
                           </div>
                           <CaretRight weight="bold" className="w-3 h-3 text-zinc-700 group-hover:text-lime-400 transition-colors mt-1" />
                        </div>
                     </div>
                   </Link>
                 ))}
               </div>
             </CardContent>
           </Card>

           {/* Security / Status Card */}
           <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/40 p-6">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <WarningCircle weight="thin" className="w-6 h-6 text-blue-400" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white">{t.auditStatus}</h4>
                    <span className="text-[10px] font-black text-blue-400/70 uppercase tracking-widest">Pending scan</span>
                 </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                {t.auditPendingDesc}
              </p>
              <Button variant="outline" className="w-full text-xs font-bold border-zinc-800 text-zinc-400 hover:text-white rounded-xl h-10">
                {t.runAudit}
              </Button>
           </Card>
        </div>

      </div>
    </div>
  );
}
