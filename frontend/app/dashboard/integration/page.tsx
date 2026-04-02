'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';

export default function IntegrationPage() {
  const [copied, setCopied] = useState(false);
  const apiKey = 'sk_live_12345abcdef'; // In reality, fetch from API
  const integrationCode = `<script src="https://cdn.accesslayer.kz/v2.js" client_id="${apiKey}"></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(integrationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Integration</h2>
        <p className="text-zinc-400 mt-1">
          Install the AccessLayer widget on your website to instantly enable AI accessibility features.
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
              <code>{integrationCode}</code>
            </pre>
          </div>
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
