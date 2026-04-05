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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">{t.title}</h2>
        <p className="text-zinc-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      {client && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Zap className="h-5 w-5" />
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

      <Card>
        <CardHeader>
          <CardTitle>{t.whitelistedDomains}</CardTitle>
          <CardDescription>
            {t.domainsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4 max-w-md">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium leading-none text-zinc-200" htmlFor="domain">
                {t.addNewDomain}
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="domain"
                  placeholder={t.domainPlaceholder}
                  className="pl-9"
                  {...form.register('domain')}
                />
              </div>
              {form.formState.errors.domain && (
                <p className="text-sm text-red-400">{form.formState.errors.domain.message}</p>
              )}
            </div>
            <Button type="submit" variant="glow" disabled={form.formState.isSubmitting}>
              <Plus className="mr-2 h-4 w-4" />
              {t.addButton}
            </Button>
          </form>

          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50">
            {domains.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                {t.noDomains}
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {domains.map((domain) => (
                  <li key={domain} className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <Globe className="mr-3 h-4 w-4 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-200">{domain}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDomain(domain)}
                      className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8"
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
      
      <Card>
        <CardHeader>
          <CardTitle>{t.apiConfig}</CardTitle>
          <CardDescription>
            {t.apiDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">{t.enterpriseOnly}</p>
        </CardContent>
      </Card>
    </div>
  );
}
