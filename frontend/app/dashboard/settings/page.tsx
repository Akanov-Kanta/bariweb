'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Globe, Plus, Copy, CheckCircle2, Zap } from 'lucide-react';
import { Organizations } from '@/lib/api/sdk.gen';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';

const domainSchema = z.object({
  domain: z.string().min(1, 'Domain is required').url('Must be a valid URL or hostname').or(
    z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/, 'Must be a valid domain name like example.com')
  ),
});

type DomainFormValues = z.infer<typeof domainSchema>;

interface ClientData {
  id: string;
  public_id: string;
  name: string;
  allowed_domains: string;
}

export default function SettingsPage() {
  const [client, setClient] = useState<ClientData | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.settings;

  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainSchema),
    defaultValues: { domain: '' },
  });

  useEffect(() => {
    fetchClient();
  }, []);

  const fetchClient = async () => {
    try {
      const res = await Organizations.getMyClients();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const clientData = res.data[0] as ClientData;
        setClient(clientData);
        setDomains(clientData.allowed_domains ? clientData.allowed_domains.split(',').map(d => d.trim()).filter(Boolean) : []);
      }
    } catch (err) {
      console.error('Failed to fetch client', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: DomainFormValues) => {
    setError(null);
    try {
      const newDomains = [...domains, data.domain];
      const domainsString = newDomains.join(',');

      if (client) {
        // Update existing client
        await Organizations.updateClient({
          path: { client_id: client.id },
          body: { domains: domainsString }
        });
        setDomains(newDomains);
      } else {
        // Register new client
        const res = await Organizations.registerClient({
          body: {
            name: data.domain, // Use domain as name for now
            domains: data.domain
          }
        });
        if (res.data && (res.data as any).client) {
          const newClient = (res.data as any).client;
          setClient(newClient);
          setDomains([data.domain]);
        }
      }
      form.reset();
    } catch (err: any) {
      setError(err.message || 'Failed to save domain');
    }
  };

  const removeDomain = async (domainToRemove: string) => {
    if (!client) return;
    
    setError(null);
    const newDomains = domains.filter(d => d !== domainToRemove);
    const domainsString = newDomains.join(',');

    try {
      await Organizations.updateClient({
        path: { client_id: client.id },
        body: { domains: domainsString }
      });
      setDomains(newDomains);
    } catch (err: any) {
      setError(err.message || 'Failed to remove domain');
    }
  };

  const copyClientId = () => {
    if (client?.public_id) {
      navigator.clipboard.writeText(client.public_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-zinc-500">{t.loading}</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-2">{t.title}</h2>
        <p className="text-zinc-400 text-lg">
          {t.subtitle}
        </p>
      </div>

      {client && (
        <Card className="dashboard-card border-lime-400/20 bg-lime-400/5 group">
          <CardHeader>
            <CardTitle className="text-lime-400 flex items-center gap-2 text-xl font-bold tracking-tight">
              <Zap className="h-5 w-5 animate-pulse" />
              {t.clientIdTitle}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.clientIdDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 font-mono text-zinc-200 flex-1">
                {client.public_id}
              </div>
              <Button variant="outline" size="icon" onClick={copyClientId}>
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">{t.whitelistedDomains}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t.domainsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4 max-w-md">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1 ml-1" htmlFor="domain">
                {t.addNewDomain}
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                <Input
                  id="domain"
                  placeholder={t.domainPlaceholder}
                  className="pl-9 h-11"
                  {...form.register('domain')}
                />
              </div>
              {form.formState.errors.domain && (
                <p className="text-xs text-red-400 font-medium ml-1">{form.formState.errors.domain.message}</p>
              )}
            </div>
            <Button type="submit" className="dashboard-btn-primary h-11 px-6 rounded-xl" disabled={form.formState.isSubmitting}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="mt-0.5">{t.addButton}</span>
            </Button>
          </form>

          {error && (
            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 text-sm text-red-500 font-medium">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-[#1f1f23] bg-black/40 overflow-hidden shadow-inner">
            {domains.length === 0 ? (
              <div className="p-12 text-center text-sm text-zinc-600 italic">
                {t.noDomains}
              </div>
            ) : (
              <ul className="divide-y divide-[#1f1f23]">
                {domains.map((domain) => (
                  <li key={domain} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-[#1f1f23] flex items-center justify-center mr-4">
                        <Globe className="h-4 w-4 text-zinc-500" />
                      </div>
                      <span className="text-sm font-bold text-zinc-200">{domain}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDomain(domain)}
                      className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg h-9 w-9 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t.removeDomain} {domain}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="dashboard-card opacity-60 border-dashed">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white mb-2">{t.apiConfig}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t.apiDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-[#1f1f23] rounded-xl">
             <div className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">Enterprise Only</div>
             <p className="text-xs text-zinc-600 font-medium">{t.enterpriseOnly}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
