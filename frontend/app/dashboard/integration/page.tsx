'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, Code, BracketsCurly, Info, ArrowUpRight, Package, Terminal } from '@phosphor-icons/react';
import { Organizations } from '@/lib/api/sdk.gen';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';

interface ClientData {
  id: string;
  public_id: string;
  name: string;
  allowed_domains: string;
}

export default function IntegrationPage() {
  const [copied, setCopied] = useState(false);
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [copiedUsage, setCopiedUsage] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.integration;

  useEffect(() => {
    const fetchClients = async () => {
      console.log('IntegrationPage: mounting and fetching clients...');
      try {
        const res = await Organizations.getMyClients();
        console.log('IntegrationPage: clients res', res);
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
    ? `<script \n  src="https://unpkg.com/bariweb-widget@latest/dist/bariweb.iife.js" \n  client-id="${selectedClientId}"\n></script>`
    : t.noDomainWarning;

  const npmInstallCode = "npm install bariweb-widget";
  const npmUsageCode = `// 1. Import it in your root layout or entry point\nimport 'bariweb-widget';\n\n// 2. Add the custom element to your application\n<bw-widget client-id="${selectedClientId || 'YOUR_CLIENT_ID'}"></bw-widget>`;

  const copyToClipboard = (text: string, type: 'script' | 'npm' | 'usage') => {
    if (!selectedClientId && type === 'script') return;
    navigator.clipboard.writeText(text);
    if (type === 'script') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (type === 'npm') {
      setCopiedNpm(true);
      setTimeout(() => setCopiedNpm(false), 2000);
    } else if (type === 'usage') {
      setCopiedUsage(true);
      setTimeout(() => setCopiedUsage(false), 2000);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl pb-20">
      {/* Header with Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">{t.title}</h2>
          <p className="text-zinc-500 text-lg max-w-2xl">
            {t.subtitle} {t.integrationSubDesc}
          </p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
          selectedClientId ? "bg-lime-400/5 border-lime-400/20 text-lime-400" : "bg-red-400/5 border-red-400/20 text-red-400"
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${selectedClientId ? "bg-lime-400" : "bg-red-400"}`} />
          <span className="text-xs font-black uppercase tracking-widest">
            {selectedClientId ? t.readyToInstall : t.setupRequired}
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Code and Tools */}
        <div className="lg:col-span-12 space-y-10">
          
          {/* SCRIPT TAG METHOD */}
          <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/60 p-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 md:px-8 py-6 border-b border-zinc-800 bg-zinc-900/10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center shrink-0">
                    <BracketsCurly weight="fill" className="w-6 h-6 text-lime-400" />
                  </div>
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded border border-lime-400/30 bg-lime-400/10 text-[9px] font-black text-lime-400 uppercase tracking-widest mb-2">Option 1 / Basic HTML</div>
                    <CardTitle className="text-white text-lg font-bold block">{t.universalScriptTitle}</CardTitle>
                    <CardDescription className="text-xs text-zinc-500">{t.universalScriptDesc}</CardDescription>
                  </div>
               </div>
               
               {clients.length > 0 && (
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <select
                      className="w-full md:w-64 bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-lime-400/50 outline-none cursor-pointer transition-all"
                      value={selectedClientId || ''}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      {clients.map(c => (
                        <option key={c.public_id} value={c.public_id}>{c.allowed_domains}</option>
                      ))}
                    </select>
                  </div>
               )}
            </div>

            <CardContent className="p-8">
               <div className="relative group">
                  <div className="h-10 bg-[#1a1a23] rounded-t-2xl flex items-center px-4 gap-2 border-x border-t border-zinc-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    <div className="ml-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{t.scriptInjection || "HTML Snippet"}</div>
                  </div>
                  
                  <div className="bg-[#05050a] border border-zinc-800 rounded-b-2xl p-6 md:p-8 font-mono text-[13px] leading-relaxed relative overflow-x-auto group-hover:border-lime-400/20 transition-colors">
                    <pre className="text-lime-400/90 block break-all whitespace-pre-wrap min-w-[200px] m-0">
                      {loading ? t.fetchingSnippet : integrationCode}
                    </pre>
                    
                    <div className="md:absolute top-4 right-4 mt-6 md:mt-0 md:translate-y-[-10px] md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300">
                       <Button 
                         onClick={() => copyToClipboard(integrationCode, 'script')}
                         disabled={!selectedClientId}
                         className="w-full md:w-auto bg-white/5 hover:bg-lime-400 text-white hover:text-black border border-white/10 rounded-xl px-5 h-11 transition-all font-black text-[10px] uppercase tracking-widest"
                       >
                         {copied ? <CheckCircle weight="bold" className="mr-2 h-4 w-4" /> : <Copy weight="fill" className="mr-2 h-4 w-4" />}
                         {copied ? t.copied : t.copySnippet}
                       </Button>
                    </div>
                  </div>
               </div>

               <div className="mt-10 grid md:grid-cols-2 gap-8">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-lime-400 shrink-0">1</div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-2">{t.codeInjectionTitle}</h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        {t.codeInjectionDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-lime-400 shrink-0">2</div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-2">{t.autoActivationTitle}</h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        {t.autoActivationDesc}
                      </p>
                    </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* NEW NPM / MODERN FRAMEWORKS METHOD */}
          <Card className="dashboard-card border-zinc-800/50 bg-[#0c0c12]/60 p-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
               <div className="px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-[9px] font-black text-lime-400 uppercase tracking-widest">{t.recommendedReact}</div>
            </div>
            
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800 bg-zinc-900/10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-400/10 border border-blue-400/30 flex items-center justify-center">
                    <Package weight="fill" className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="inline-block px-2 py-0.5 rounded border border-blue-400/30 bg-blue-400/10 text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Option 2 / Modern Frameworks</div>
                    <CardTitle className="text-white text-lg font-bold block">{t.npmFrameworksTitle}</CardTitle>
                    <CardDescription className="text-xs text-zinc-500">{t.npmFrameworksDesc}</CardDescription>
                  </div>
               </div>
            </div>

            <CardContent className="p-8 space-y-8">
               <div className="space-y-4">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">{t.stepInstallPackage}</h4>
                  <div className="group relative">
                    <div className="flex items-center justify-between bg-[#05050a] border border-zinc-800 rounded-2xl px-6 py-4 font-mono text-[13px] group-hover:border-blue-400/30 transition-all duration-300">
                      <div className="flex items-center gap-3">
                         <Terminal weight="fill" className="text-zinc-600 h-4 w-4" />
                         <span className="text-blue-400">$ </span>
                         <span className="text-zinc-100">{npmInstallCode}</span>
                      </div>
                      <Button 
                        onClick={() => copyToClipboard(npmInstallCode, 'npm')}
                        className="bg-zinc-900 hover:bg-blue-500 text-zinc-500 hover:text-white border border-zinc-800 rounded-xl px-4 h-9 transition-all text-[10px] font-black uppercase"
                      >
                         {copiedNpm ? <CheckCircle weight="bold" className="mr-2 h-3.5 w-3.5" /> : <Copy weight="fill" className="mr-2 h-3.5 w-3.5" />}
                         {copiedNpm ? t.copied : 'Copy'}
                      </Button>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">{t.stepInitializeApp || "Import & Use"}</h4>
                  <div className="group relative">
                    <div className="h-10 bg-[#1a1a23] rounded-t-2xl flex items-center px-4 gap-2 border-x border-t border-zinc-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                      <div className="ml-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{t.scriptInjection || "Code"}</div>
                    </div>
                    <div className="bg-[#05050a] border border-zinc-800 rounded-b-2xl p-6 font-mono text-[13px] leading-relaxed text-zinc-300 group-hover:border-blue-400/30 transition-all duration-300 overflow-x-auto relative">
                      <pre className="whitespace-pre-wrap">
                        {npmUsageCode}
                      </pre>
                      
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                         <Button 
                           onClick={() => copyToClipboard(npmUsageCode, 'usage')}
                           className="bg-zinc-900 hover:bg-blue-500 text-zinc-500 hover:text-white border border-zinc-800 rounded-xl px-4 h-9 transition-all text-[10px] font-black uppercase"
                         >
                           {copiedUsage ? <CheckCircle weight="bold" className="mr-2 h-3.5 w-3.5" /> : <Copy weight="fill" className="mr-2 h-3.5 w-3.5" />}
                           {copiedUsage ? t.copied : 'Copy'}
                         </Button>
                      </div>
                    </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Tips Section */}
          <div className="grid md:grid-cols-2 gap-8">
             <Card className="dashboard-card border-zinc-800 bg-zinc-900/20 p-8 flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Info weight="thin" className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                   <h4 className="text-white font-bold mb-2">{t.whereIsClientId}</h4>
                   <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                     {t.clientIdHint}
                   </p>
                   <a href="/dashboard/settings" className="text-[10px] font-black uppercase tracking-widest text-lime-400 border-b border-lime-400/30 hover:border-lime-400 transition-colors inline-flex items-center gap-1 group">
                      {t.manageDomains} <ArrowUpRight className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                   </a>
                </div>
             </Card>

             <Card className="dashboard-card border-zinc-800 bg-zinc-900/20 p-8 flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Code weight="thin" className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                   <h4 className="text-white font-bold mb-2">{t.gtmTitle}</h4>
                   <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                      {t.gtmDesc}
                   </p>
                   <button className="text-[10px] font-black uppercase tracking-widest text-blue-400 border-b border-blue-400/30 hover:border-blue-400 transition-colors">
                      {t.gtmGuide}
                   </button>
                </div>
             </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
