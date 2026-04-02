import { cookies } from 'next/headers';
import { Auth } from '@/lib/api/sdk.gen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, ShieldCheck, Zap } from 'lucide-react';
import { OverviewChart } from '@/components/OverviewChart';

export default async function DashboardOverview() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  // Call backend from Server Component using the extracted cookie
  let userData = null;
  try {
    const res = await Auth.me({
      headers: {
        Cookie: `access_token=${token}`
      }
    });
    if (!res.error) {
      userData = res.data;
    }
  } catch (error) {
    console.error('Failed to fetch user data', error);
  }

  // Mock dashboard stats
  const stats = [
    {
      title: 'Sessions Used',
      value: '12,450',
      description: '/ 50,000 this month',
      icon: Users,
      trend: '+12% from last month',
    },
    {
      title: 'Accessibility Score',
      value: '98%',
      description: 'Excellent',
      icon: ShieldCheck,
      trend: '+2% from last week',
    },
    {
      title: 'Active Integrations',
      value: '2',
      description: 'Domains whitelisted',
      icon: Activity,
      trend: 'Stable',
    },
    {
      title: 'Avg. Load Impact',
      value: '< 50ms',
      description: 'Widget performace',
      icon: Zap,
      trend: 'Optimized',
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
            <OverviewChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
