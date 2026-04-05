'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Globe, Plus, Copy, CheckCircle2, Zap, Key } from 'lucide-react';
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
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasAdminKey, setHasAdminKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.settings;

  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainSchema),
    defaultValues: { domain: '' },
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await Organizations.getMyClients();
      if (res.data && Array.isArray(res.data)) {
        const data = res.data as ClientData[];
        setClients(data);
        if (data.length > 0) setSelectedClient(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch clients', err);
    } finally {
      setLoading(false);
    }
  };

  const checkKeyStatus = async (clientId: string) => {
    try {
      const res = await (Organizations as any).getAdminKeyStatus({ path: { client_id: clientId } });
      if (res.data) setHasAdminKey(res.data.has_key);
    } catch (err) {
      console.error('Failed to check key status', err);
    }
  };

  // Reload key status whenever selected client changes
  useEffect(() => {
    if (selectedClient) {
      setNewKey(null);
      setHasAdminKey(false);
      checkKeyStatus(selectedClient.id);
    }
  }, [selectedClient?.id]);

  const generateAdminKey = async () => {
    if (!selectedClient) return;
    setKeyLoading(true);
    setError(null);
    try {
      const res = await (Organizations as any).generateAdminKey({ path: { client_id: selectedClient.id } });
      if (res.data?.plain_key) {
        setNewKey(res.data.plain_key);
        setHasAdminKey(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate key');
    } finally {
      setKeyLoading(false);
    }
  };

  const onSubmit = async (data: DomainFormValues) => {
    setError(null);
    try {
      const res = await Organizations.registerClient({ body: { name: data.domain, domains: data.domain } });
      if (res.error) { setError(JSON.stringify(res.error)); return; }
      if (res.data && (res.data as any).client) {
        const newClient = (res.data as any).client as ClientData;
        setClients(prev => [...prev, newClient]);
        setSelectedClient(newClient);
      }
      form.reset();
    } catch (err: any) {
      setError(err.message || 'Failed to save domain');
    }
  };

  const removeClient = async (clientId: string) => {
    setError(null);
    try {
      await Organizations.deleteClient({ path: { client_id: clientId } });
      const remaining = clients.filter(c => c.id !== clientId);
      setClients(remaining);
      if (selectedClient?.id === clientId) setSelectedClient(remaining[0] ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove domain');
    }
  };

  const copyText = (text: string, tag: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(tag);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500">{t.loading}</div>;

  const widgetSnippet = selectedClient
    ? `<bw-widget client-id="${selectedClient.public_id}"></bw-widget>\n<script src="/bariweb.iife.js" defer></script>`
    : '';

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-2">{t.title}</h2>
        <p className="text-zinc-400 text-lg">{t.subtitle}</p>
      </div>

      {/* Client selector — only when multiple clients */}
      {clients.length > 1 && (
        <Card className="dashboard-card border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base font-semibold">Выберите сайт</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {clients.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    selectedClient?.id === c.id
                      ? 'bg-lime-400/10 border-lime-400/40 text-lime-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {c.allowed_domains}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client ID card — always shows the SELECTED client's public_id */}
      {selectedClient && (
        <Card className="dashboard-card border-lime-400/20 bg-lime-400/5">
          <CardHeader>
            <CardTitle className="text-lime-400 flex items-center gap-2 text-xl font-bold">
              <Zap className="h-5 w-5 animate-pulse" />
              {t.clientIdTitle}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.clientIdDesc} — <strong className="text-zinc-300">{selectedClient.allowed_domains}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Client ID (вставить в <code className="text-lime-400">client-id</code> атрибут виджета)
              </p>
              <div className="flex items-center gap-2">
                <div className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 font-mono text-lime-400 flex-1 text-lg">
                  {selectedClient.public_id}
                </div>
                <Button variant="outline" size="icon" onClick={() => copyText(selectedClient.public_id, 'pubid')}>
                  {copiedId === 'pubid' ? <CheckCircle2 className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">HTML snippet</p>
              <div className="flex items-start gap-2">
                <pre className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 font-mono text-zinc-300 flex-1 text-xs overflow-x-auto">
                  {widgetSnippet}
                </pre>
                <Button variant="outline" size="icon" className="flex-shrink-0" onClick={() => copyText(widgetSnippet, 'snippet')}>
                  {copiedId === 'snippet' ? <CheckCircle2 className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Key — scoped to selectedClient */}
      {selectedClient && (
        <Card className="dashboard-card border-zinc-800 bg-zinc-900/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-zinc-400" />
              {t.securityTitle}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t.securityDesc} — сайт{' '}
              <strong className="text-zinc-300">{selectedClient.allowed_domains}</strong>{' '}
              (client-id: <span className="font-mono text-lime-400">{selectedClient.public_id}</span>)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white mb-1">{t.keyActive}</span>
                <span className="text-xs text-zinc-500">{hasAdminKey ? '✓ Active' : '× Not set'}</span>
              </div>
              <Button
                onClick={generateAdminKey}
                disabled={keyLoading}
                className="h-10 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
              >
                {keyLoading ? t.loading : hasAdminKey ? t.rotateKey : t.generateKey}
              </Button>
            </div>

            {newKey && (
              <div className="p-5 border-2 border-lime-400/30 bg-lime-400/5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 text-lime-400 mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-bold">{t.keyWarning}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 font-mono text-lime-400 text-sm flex-1 break-all select-all">
                    {newKey}
                  </div>
                  <Button
                    variant="outline" size="icon"
                    className="h-11 w-11 flex-shrink-0 border-zinc-800 hover:bg-lime-400/10 hover:text-lime-400"
                    onClick={() => copyText(newKey, 'new_key')}
                  >
                    {copiedId === 'new_key' ? <CheckCircle2 className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Whitelisted Domains */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">{t.whitelistedDomains}</CardTitle>
          <CardDescription className="text-zinc-400">{t.domainsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4 max-w-md">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1 ml-1" htmlFor="domain">
                {t.addNewDomain}
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                <Input id="domain" placeholder={t.domainPlaceholder} className="pl-9 h-11" {...form.register('domain')} />
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
            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 text-sm text-red-500 font-medium">{error}</div>
          )}

          <div className="rounded-2xl border border-[#1f1f23] bg-black/40 overflow-hidden shadow-inner">
            {clients.length === 0 ? (
              <div className="p-12 text-center text-sm text-zinc-600 italic">{t.noDomains}</div>
            ) : (
              <ul className="divide-y divide-[#1f1f23]">
                {clients.map(client => (
                  <li key={client.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-[#1f1f23] flex items-center justify-center mr-4">
                        <Globe className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-200">{client.allowed_domains}</span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                          client-id: <span className="text-lime-400/70">{client.public_id}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => copyText(client.public_id, client.id + '_copy')} className="h-9 w-9 text-zinc-500 hover:text-lime-400 rounded-lg">
                        {copiedId === client.id + '_copy' ? <CheckCircle2 className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeClient(client.id)} className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg h-9 w-9 p-0">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t.removeDomain} {client.allowed_domains}</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
