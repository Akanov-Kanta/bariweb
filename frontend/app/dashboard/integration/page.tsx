'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { Organizations } from '@/lib/api/sdk.gen';

interface ClientData {
  id: string;
  public_id: string;
  name: string;
  allowed_domains: string;
}

export default function IntegrationPage() {
  const [copied, setCopied] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await Organizations.getMyClients();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const fetchedClients = res.data as ClientData[];
          setClients(fetchedClients);
          setSelectedClientId(fetchedClients[0].public_id);
        }
      } catch (err) {
        console.error('Failed to fetch clients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const integrationCode = selectedClientId 
    ? `<script src="https://widget.bariweb.org/bariweb.js" data-client-id="${selectedClientId}"></script>`
    : '<!-- Register your domain in Settings to get your Client ID -->';

  const copyToClipboard = () => {
    if (!selectedClientId) return;
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
            Select your registered domain to get the correct integration code. Each domain has its own unique Client ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length > 0 && (
            <div className="mb-4">
              <label htmlFor="domain-select" className="block text-sm font-medium text-zinc-300 mb-2">
                Select Domain
              </label>
              <select
                id="domain-select"
                className="w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                {clients.map(c => (
                  <option key={c.public_id} value={c.public_id}>{c.allowed_domains}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-mono text-sm text-zinc-300">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800/50">
              <span className="text-zinc-500 text-xs">HTML</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyToClipboard}
                disabled={!selectedClientId || loading}
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
            <pre className="overflow-x-auto p-2 text-zinc-300">
              <code>{loading ? 'Loading...' : integrationCode}</code>
            </pre>
          </div>
          {!selectedClientId && !loading && (
            <p className="mt-4 text-sm text-amber-500 font-medium">
              ⚠️ You need to add at least one domain in Settings to generate your integration code.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Manage your domains</CardTitle>
          <CardDescription>
            You can register additional domains in the settings panel. Each new domain will receive its own individual tracking ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/dashboard/settings">Go to Domain Settings</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
