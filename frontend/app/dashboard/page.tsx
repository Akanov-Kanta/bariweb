'use client';

import { useState, useEffect } from 'react';
import { Auth, Organizations } from '@/lib/api/sdk.gen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';

export default function DashboardOverview() {
  const [userData, setUserData] = useState<any>(null);
  const [clientsCount, setClientsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.overview;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, clientsRes] = await Promise.all([
          Auth.me(),
          Organizations.getMyClients()
        ]);

        if (!userRes.error) {
          setUserData(userRes.data);
        }
        
        if (!clientsRes.error && Array.isArray(clientsRes.data)) {
          let count = 0;
          clientsRes.data.forEach((client: any) => {
            if (client.allowed_domains) {
              count += client.allowed_domains.split(',').filter(Boolean).length;
            }
          });
          setClientsCount(count);
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
      title: t.activeIntegrations,
      value: clientsCount.toString(),
      description: t.domainsWhitelisted,
      icon: Activity,
      trend: t.realtime,
    },
    {
      title: t.sessionsUsed,
      value: '0',
      description: t.monthlyUsage,
      icon: Users,
      trend: t.newAccount,
    },
    {
      title: t.accessibilityScore,
      value: 'N/A',
      description: t.requiresScan,
      icon: ShieldCheck,
      trend: t.pending,
    },
    {
      title: t.avgLoadImpact,
      value: '< 50ms',
      description: t.optimal,
      icon: Zap,
      trend: t.verified,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-2">{t.title}</h2>
          <p className="text-zinc-400 text-lg">
            {t.welcome}{userData?.email ? `, ${userData.email}` : ''}. {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-lime-400/10 border border-lime-400/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <span className="text-xs font-bold text-lime-400 uppercase tracking-widest">{t.realtime}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:border-lime-400/30 transition-all group dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-zinc-500 group-hover:text-lime-400 transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="flex items-center text-xs text-zinc-400 space-x-2">
                <span className="opacity-70">{stat.description}</span>
                <span className="text-lime-400/80 font-bold uppercase tracking-tighter">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-7 dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">{t.usageActivity}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex flex-col items-center justify-center h-[350px] space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-[#1f1f23] flex items-center justify-center opacity-20">
                <Activity className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="text-zinc-600 italic text-sm max-w-sm text-center">
                {t.noActivity}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
