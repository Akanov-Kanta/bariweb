'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { Organizations } from '@/lib/api/sdk.gen';

export default function IntegrationPage() {
  const [copied, setCopied] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    : '<!-- Register your domain in Settings to get your Client ID -->';

  const copyToClipboard = () => {
    if (!clientId) return;
    navigator.clipboard.writeText(integrationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Integration</h2>
        <p className="text-zinc-400 mt-1">
          Install the Bariweb widget on your website to instantly enable AI accessibility features.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Add to your HTML</CardTitle>
          <CardDescription>
            Copy the script tag below and paste it just before the closing <code>&lt;/body&gt;</code> tag of every page where you want the widget to appear.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-mono text-sm text-zinc-300">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800/50">
              <span className="text-zinc-500 text-xs">HTML</span>
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
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto p-2">
              <code>{loading ? 'Loading...' : integrationCode}</code>
            </pre>
          </div>
          {!clientId && !loading && (
            <p className="mt-4 text-sm text-amber-500 font-medium">
              ⚠️ You need to add at least one domain in Settings to generate your Client ID.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Whitelist your domains</CardTitle>
          <CardDescription>
            For security reasons, the widget will only load on domains that have been whitelisted in your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400 mb-4">
            Head over to your settings to manage allowed domains. The widget will be completely invisible on any unauthorized domains.
          </p>
          <Button variant="outline" asChild>
            <a href="/dashboard/settings">Go to Domain Settings</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
