'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Trash, 
  Globe, 
  Plus, 
  Copy, 
  CheckCircle, 
  Lightning, 
  Key, 
  ShieldCheck, 
  Browser, 
  ArrowRight,
  CaretRight,
  Shield,
  CircleNotch
} from '@phosphor-icons/react';
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

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
       <CircleNotch className="w-8 h-8 text-lime-400 animate-spin" weight="thin" />
    </div>
  );

  return (
    <div className="space-y-10 max-w-6xl pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">{t.title}</h2>
          <p className="text-zinc-500 text-lg max-w-2xl">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Sidebar: Site Selection */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/40 overflow-hidden">
             <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.yourSites}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500">{clients.length}</span>
             </div>
             <CardContent className="p-0">
                <div className="divide-y divide-zinc-800/30">
                  {clients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`w-full flex items-center justify-between p-5 text-left transition-all group ${
                        selectedClient?.id === c.id 
                        ? 'bg-lime-400/[0.03] border-l-2 border-lime-400' 
                        : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          selectedClient?.id === c.id ? 'bg-lime-400/10 text-lime-400' : 'bg-zinc-900 text-zinc-700'
                        }`}>
                           <Globe weight="thin" className="w-5 h-5" />
                        </div>
                        <div>
                           <p className={`text-sm font-bold transition-colors ${selectedClient?.id === c.id ? 'text-white' : 'text-zinc-500Group-hover:text-zinc-300'}`}>
                             {c.allowed_domains}
                           </p>
                           <p className="text-[10px] font-mono text-zinc-700 mt-0.5">ID: {c.public_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <CaretRight weight="bold" className={`w-3 h-3 transition-transform ${selectedClient?.id === c.id ? 'text-lime-400' : 'text-zinc-800 group-hover:translate-x-1'}`} />
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => {}} 
                    className="w-full flex items-center gap-4 p-5 text-zinc-600 hover:text-lime-400 transition-colors group"
                  >
                     <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-lime-400/30 flex items-center justify-center">
                        <Plus weight="bold" className="w-4 h-4" />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-widest">{t.addNewDomain}</span>
                  </button>
                </div>
             </CardContent>
           </Card>

           {/* Quick Stats Panel */}
           <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/40 p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-lime-400/10 flex items-center justify-center">
                 <Shield weight="thin" className="w-6 h-6 text-lime-400" />
              </div>
              <div>
                 <h4 className="text-xs font-black text-white uppercase tracking-widest leading-tight">{t.securityLevel}</h4>
                 <p className="text-[10px] font-bold text-lime-500/70 mt-1 uppercase">{t.enhancedShielding}</p>
              </div>
           </Card>
        </div>

        {/* Right Main Column: Content */}
        <div className="lg:col-span-8 space-y-8">
           {selectedClient ? (
             <div className="grid gap-6 md:grid-cols-2">
                
                {/* Brick 1: Public ID */}
                <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/60 overflow-hidden flex flex-col h-full hover:border-lime-400/20 transition-colors"> 
                   <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/10">
                      <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
                         <Browser weight="fill" className="w-5 h-5 text-lime-400" />
                      </div>
                      <div>
                         <CardTitle className="text-white text-[15px] font-bold tracking-tight">{t.publicIdLabel}</CardTitle>
                         <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider truncate">{selectedClient.allowed_domains}</p>
                      </div>
                   </div>
                   <CardContent className="p-6 mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl p-4 font-mono text-lime-400 text-sm shadow-inner truncate leading-none">
                           {selectedClient.public_id}
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-12 w-12 shrink-0 border-zinc-800 hover:bg-lime-400/10 hover:text-lime-400 rounded-xl transition-all"
                          onClick={() => copyText(selectedClient.public_id, 'pubid')}
                        >
                          {copiedId === 'pubid' ? <CheckCircle weight="bold" className="h-5 w-5" /> : <Copy weight="fill" className="h-5 w-5" />}
                        </Button>
                      </div>
                   </CardContent>
                </Card>

                {/* Brick 2: Admin Keys */}
                <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/60 overflow-hidden flex flex-col h-full hover:border-purple-400/20 transition-colors">
                   <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <Key weight="fill" className="w-5 h-5 text-purple-400" />
                         </div>
                         <CardTitle className="text-white text-[15px] font-bold tracking-tight">{t.accessControl}</CardTitle>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${hasAdminKey ? 'bg-lime-400 shadow-[0_0_10px_#c8ff00]' : 'bg-red-500'}`} />
                   </div>
                   <CardContent className="p-6 mt-auto">
                      <Button 
                        onClick={generateAdminKey}
                        disabled={keyLoading}
                        className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider border border-zinc-800 transition-all shadow-sm"
                      >
                        {keyLoading ? '...' : hasAdminKey ? t.recycleKeys : t.generateKey}
                      </Button>
                   </CardContent>
                </Card>

                {/* Brick 3: COMPACT REGISTER FORM (Left) */}
                <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/60 p-6 flex flex-col justify-center min-h-[170px] hover:border-lime-400/10 transition-colors">
                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="flex items-center gap-2 mb-1 pl-1">
                         <Plus weight="bold" className="w-4 h-4 text-lime-400" />
                         <h3 className="text-xs font-bold text-white uppercase tracking-tight">{t.registerProperty}</h3>
                      </div>
                      <div className="flex flex-col gap-3">
                         <div className="relative group/input">
                            <Globe weight="thin" className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5 group-focus-within/input:text-lime-400 transition-colors py-2" />
                            <Input 
                              id="domain" 
                              placeholder={t.domainPlaceholder} 
                              className="h-11 bg-zinc-950 border-zinc-900 rounded-xl pl-14 pr-4 text-sm text-white placeholder:text-zinc-700/50 focus:ring-1 focus:ring-lime-400/30 transition-all font-medium" 
                              {...form.register('domain')} 
                            />
                         </div>
                         <Button type="submit" className="h-11 rounded-xl font-bold bg-lime-400 text-black text-[11px] uppercase tracking-tight hover:bg-lime-500 transition-all w-full shadow-lg shadow-lime-400/5" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? '...' : t.addToProtection}
                         </Button>
                      </div>
                   </form>
                </Card>

                {/* Brick 4: STREAMLINED DOMAIN DETAILS (Right) */}
                <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/60 overflow-hidden flex flex-col min-h-[170px] hover:border-blue-400/10 transition-colors">
                   <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10">
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center shrink-0">
                            <ShieldCheck weight="fill" className="w-5 h-5 text-blue-400" />
                         </div>
                         <div className="min-w-0">
                            <h4 className="text-[12px] font-bold text-white truncate leading-tight">{selectedClient.allowed_domains}</h4>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{t.propertySite}</p>
                         </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => removeClient(selectedClient.id)} 
                        className="h-9 w-9 p-0 text-zinc-700 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                      >
                        <Trash weight="thin" className="h-5 w-5" />
                      </Button>
                   </div>
                   <CardContent className="p-6 flex-1 flex flex-col justify-end gap-4">
                      <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl transition-all hover:border-lime-400/20">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                            <span className="text-xs text-white font-bold tracking-tight">{t.keyActive}</span>
                         </div>
                         <a href="/dashboard/integration" className="text-[11px] font-black text-lime-400 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1">
                            {t.script} <ArrowRight size={12} weight="bold" />
                         </a>
                      </div>
                      {newKey && (
                        <div className="p-3 border border-lime-400/20 bg-lime-400/5 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                           <p className="text-[10px] font-mono text-lime-400 break-all select-all text-center">{newKey}</p>
                        </div>
                      )}
                   </CardContent>
                </Card>
             </div>
           ) : (
             <div className="h-[400px] flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-zinc-900 rounded-3xl opacity-50 bg-[#0c0c12]/20">
                <Globe weight="thin" className="w-16 h-16 text-zinc-700 mb-6" />
                <h3 className="text-xl font-bold text-zinc-500 mb-2">{t.selectOrAdd}</h3>
                <p className="text-sm text-zinc-700 max-w-xs leading-relaxed">
                   {t.settingsLinkDesc}
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
