import { cookies } from 'next/headers';
import { Auth, Organizations } from '@/lib/api/sdk.gen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, ShieldCheck, Zap } from 'lucide-react';
import { OverviewChart } from '@/components/OverviewChart';

export default async function DashboardOverview() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const cookieHeader = `access_token=${token}`;
  
  let userData = null;
  let clientsCount = 0;
  
  try {
    const [userRes, clientsRes] = await Promise.all([
      Auth.me({ headers: { Cookie: cookieHeader } }),
      Organizations.getMyClients({ headers: { Cookie: cookieHeader } })
    ]);

    if (!userRes.error) {
      userData = userRes.data;
    }
    
    if (!clientsRes.error && Array.isArray(clientsRes.data)) {
      // Sum up domains from all clients or just count them
      clientsRes.data.forEach((client: any) => {
        if (client.allowed_domains) {
          clientsCount += client.allowed_domains.split(',').filter(Boolean).length;
        }
      });
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data', error);
  }

  const stats = [
    {
      title: 'Active Integrations',
      value: clientsCount.toString(),
      description: 'Domains whitelisted',
      icon: Activity,
      trend: 'Real-time',
    },
    {
      title: 'Sessions Used',
      value: '0',
      description: 'Monthly usage',
      icon: Users,
      trend: 'New account',
    },
    {
      title: 'Accessibility Score',
      value: 'N/A',
      description: 'Requires scan',
      icon: ShieldCheck,
      trend: 'Pending',
    },
    {
      title: 'Avg. Load Impact',
      value: '< 50ms',
      description: 'Optimal',
      icon: Zap,
      trend: 'Verified',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Overview</h2>
        <p className="text-zinc-400 mt-1">
          Welcome back{userData?.email ? `, ${userData.email}` : ''}. Here's what's happening with your widget today.
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
            <CardTitle>Usage Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex items-center justify-center h-[300px] text-zinc-600 italic">
              No activity data available yet. Install the widget to see analytics.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
