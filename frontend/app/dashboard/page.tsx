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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">{t.title}</h2>
        <p className="text-zinc-400 mt-1">
          {t.welcome}{userData?.email ? `, ${userData.email}` : ''}. {t.subtitle}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">{stat.value}</div>
              <div className="flex items-center text-xs mt-1 text-zinc-400 space-x-2">
                <span>{stat.description}</span>
                <span className="text-emerald-500 font-medium">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-7">
          <CardHeader>
            <CardTitle>{t.usageActivity}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex items-center justify-center h-[300px] text-zinc-600 italic">
              {t.noActivity}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
