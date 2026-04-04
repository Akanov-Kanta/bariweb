'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Download, AlertCircle } from 'lucide-react';
import { Organizations } from '@/lib/api/sdk.gen';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [hasClients, setHasClients] = useState(false);

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
        <h2 className="text-3xl font-bold tracking-tight text-white italic">Compliance Reports</h2>
        <p className="text-zinc-400 mt-1">
          View and download accessibility audit reports for your domains.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            WCAG 2.1 Audit History
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Reports are automatically generated once we collect enough interaction data.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center p-12">
          {loading ? (
            <div className="space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm text-zinc-500 font-mono">SCANNING DATABASE...</p>
            </div>
          ) : !hasClients ? (
            <div className="space-y-6">
              <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-zinc-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">No Sites Integrated</h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                  You need to integrate Bariweb on at least one domain to start generating compliance reports.
                </p>
              </div>
              <Button asChild variant="glow">
                <a href="/dashboard/integration">Start Integration</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-blue-500 animate-[spin_3s_linear_infinite]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Generating First Report</h3>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                  Data collection is in progress. Our AI agents are currently auditing your sites for WCAG 2.1 / Section 508 compliance.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" disabled className="border-zinc-800">
                  <Download className="h-4 w-4 mr-2" /> PDF Report
                </Button>
                <Button variant="outline" disabled className="border-zinc-800">
                  <Download className="h-4 w-4 mr-2" /> JSON Export
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl border-dashed opacity-50">
        <CardContent className="py-6">
          <p className="text-xs text-center text-zinc-500 font-mono italic">
            SECURE AUDIT LOG CHANNEL #0712 - NO EXTERNAL LEAKS DETECTED
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
