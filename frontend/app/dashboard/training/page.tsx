'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, FileEdit, Clock, Globe,
  Search, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ClientInfo {
  id: string;
  public_id: string;
  name: string;
  allowed_domains: string;
}

interface Screen {
  id: string;
  fingerprint: string;
  label: string;
  description: string | null;
  is_draft: boolean;
  page_url: string;
  created_at: string | null;
}

type FilterStatus = 'all' | 'draft' | 'confirmed';

function StatusBadge({ isDraft }: { isDraft: boolean }) {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.training;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
      isDraft
        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
        : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
    )}>
      {isDraft
        ? <><Clock className="h-3 w-3" />{t.draft}</>
        : <><CheckCircle2 className="h-3 w-3" />{t.trained}</>}
    </span>
  );
}

// ─── Label format helpers ─────────────────────────────────────────────────
// DB format:  "PageName | btn:Магазин наград · a:Подробнее · input:Email"
// For agent:  full label is passed as-is
// For admin:  split into pageName + funcs[] for easy editing

type ScreenFunc = { type: string; label: string };

function parseLabel(raw: string): { pageName: string; funcs: ScreenFunc[] } {
  const [pagePart, tokenPart] = raw.split('|').map(s => s.trim());
  const pageName = pagePart || raw;
  const funcs: ScreenFunc[] = [];
  if (tokenPart) {
    tokenPart.split('·').forEach(t => {
      const clean = t.trim();
      const colonIdx = clean.indexOf(':');
      if (colonIdx > -1) {
        funcs.push({ type: clean.slice(0, colonIdx), label: clean.slice(colonIdx + 1).trim() });
      } else if (clean) {
        funcs.push({ type: 'btn', label: clean });
      }
    });
  }
  return { pageName, funcs };
}

function serializeLabel(pageName: string, funcs: ScreenFunc[]): string {
  if (funcs.length === 0) return pageName.trim();
  const tokenPart = funcs.map(f => `${f.type}:${f.label}`).join(' · ');
  return `${pageName.trim()} | ${tokenPart}`;
}

const TYPE_COLORS: Record<string, string> = {
  btn:   'bg-violet-500/15 text-violet-300 border-violet-500/30',
  a:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
  input: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};
const TYPE_LABEL: Record<string, string> = { btn: 'Кнопка', a: 'Ссылка', input: 'Поле' };

function ScreenCard({ screen, onUpdated }: { screen: Screen; onUpdated: (id: string, newLabel: string, newDesc: string) => void }) {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.training;
  const parsed = parseLabel(screen.label);
  const [expanded, setExpanded] = useState(screen.is_draft);
  const [pageName, setPageName] = useState(parsed.pageName);
  const [funcs, setFuncs] = useState<ScreenFunc[]>(parsed.funcs);
  const [description, setDescription] = useState(screen.description || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFuncLabel, setNewFuncLabel] = useState('');
  const [newFuncType, setNewFuncType] = useState('btn');

  const addFunc = () => {
    if (!newFuncLabel.trim()) return;
    setFuncs(f => [...f, { type: newFuncType, label: newFuncLabel.trim() }]);
    setNewFuncLabel('');
  };

  const removeFunc = (idx: number) => setFuncs(f => f.filter((_, i) => i !== idx));

  const handleConfirm = async () => {
    if (!pageName.trim()) { setError(t.screenLabelRequired); return; }
    setSaving(true);
    setError(null);
    const fullLabel = serializeLabel(pageName, funcs);
    try {
      const res = await fetch(`${API_BASE}/v1/training/dashboard/confirm/${screen.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ label: fullLabel, description: description.trim() || null }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          onUpdated(screen.id, fullLabel, description.trim() || '');
        }, 1400);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || `Error ${res.status}`);
      }
    } catch {
      setError(t.errorNetwork);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-300',
      screen.is_draft
        ? 'border-amber-400/20 bg-amber-400/[0.03] hover:border-amber-400/40'
        : 'border-emerald-400/20 bg-emerald-400/[0.03] hover:border-emerald-400/40'
    )}>
      {/* ── Collapsed header ── */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <StatusBadge isDraft={screen.is_draft} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-200 truncate">{pageName}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {funcs.slice(0, 4).map((f, i) => (
                <span key={i} className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border',
                  TYPE_COLORS[f.type] || 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40'
                )}>
                  {f.label}
                </span>
              ))}
              {funcs.length > 4 && (
                <span className="text-[9px] text-zinc-600">+{funcs.length - 4}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-[10px] font-mono text-zinc-600 hidden sm:block">
            {screen.fingerprint.slice(0, 10)}…
          </span>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-zinc-500" />
            : <ChevronDown className="h-4 w-4 text-zinc-500" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-800/60 pt-4">

          {/* Page name */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              Название страницы *
            </label>
            <Input
              value={pageName}
              onChange={e => setPageName(e.target.value)}
              placeholder={t.placeholderLabel}
              className="bg-zinc-950 border-zinc-800 text-zinc-100 h-10 text-sm"
            />
          </div>

          {/* Functions tag editor */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
              Функции на странице
              <span className="ml-2 text-zinc-700 normal-case font-normal">(агент использует это для навигации)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
              {funcs.map((f, idx) => (
                <span key={idx} className={cn(
                  'inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-xs font-semibold border',
                  TYPE_COLORS[f.type] || 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40'
                )}>
                  <span className="text-[9px] opacity-60">{TYPE_LABEL[f.type] || f.type}</span>
                  {f.label}
                  <button
                    onClick={() => removeFunc(idx)}
                    className="ml-1 opacity-60 hover:opacity-100 hover:text-red-400 transition-colors rounded p-0.5"
                  >✕</button>
                </span>
              ))}
              {funcs.length === 0 && (
                <span className="text-[11px] text-zinc-600 italic">Нет функций — добавьте ниже</span>
              )}
            </div>
            {/* Add function row */}
            <div className="flex gap-2">
              <select
                value={newFuncType}
                onChange={e => setNewFuncType(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1.5 outline-none w-24 flex-shrink-0"
              >
                <option value="btn">Кнопка</option>
                <option value="a">Ссылка</option>
                <option value="input">Поле</option>
              </select>
              <Input
                value={newFuncLabel}
                onChange={e => setNewFuncLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFunc()}
                placeholder="Название функции..."
                className="bg-zinc-950 border-zinc-800 text-zinc-100 h-8 text-sm flex-1"
              />
              <Button
                onClick={addFunc}
                variant="ghost"
                className="h-8 px-3 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs"
              >+ Добавить</Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              {t.descriptionLabel}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 resize-none outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button
            onClick={handleConfirm}
            disabled={saving || saved}
            className={cn(
              'w-full h-9 rounded-lg font-bold text-sm transition-all',
              saved ? 'bg-emerald-500 text-white'
                : screen.is_draft ? 'bg-amber-400 hover:bg-amber-300 text-black'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            )}
          >
            {saved ? <><CheckCircle2 className="h-4 w-4 mr-2" />{t.saved}</>
              : saving ? t.saving
              : screen.is_draft ? <><CheckCircle2 className="h-4 w-4 mr-2" />{t.confirmRag}</>
              : <><FileEdit className="h-4 w-4 mr-2" />{t.update}</>}
          </Button>

          {screen.created_at && (
            <p className="text-[10px] text-zinc-600 text-right">
              {t.createdAt}: {new Date(screen.created_at).toLocaleString(lang === 'ru' ? 'ru-RU' : lang === 'kz' ? 'kk-KZ' : 'en-US')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrainingPage() {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard.training;
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  // Load clients on mount
  useEffect(() => {
    fetch(`${API_BASE}/v1/training/dashboard/clients`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((data: ClientInfo[]) => {
        setClients(data);
        if (data.length > 0) setSelectedClientId(data[0].public_id);
      })
      .catch(() => {});
  }, []);

  const fetchScreens = useCallback(async () => {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      // Fetch all screens regardless of filter, so stats are always accurate
      const params = new URLSearchParams({ client_public_id: selectedClientId });

      const res = await fetch(`${API_BASE}/v1/training/dashboard/screens?${params}`, {
        credentials: 'include',
      });
      if (res.ok) setScreens(await res.json());
    } catch (e) {
      console.error('Failed to fetch screens', e);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => { fetchScreens(); }, [fetchScreens]);

  const handleScreenUpdated = (id: string, label: string, desc: string) => {
    setScreens(prev => prev.map(s => s.id === id ? { ...s, is_draft: false, label, description: desc } : s));
  };

  const filtered = screens.filter(s => {
    const matchesSearch = !search ||
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      (s.page_url || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'draft' && s.is_draft) || 
      (filter === 'confirmed' && !s.is_draft);
      
    return matchesSearch && matchesFilter;
  });

  const draftsCount = screens.filter(s => s.is_draft).length;
  const confirmedCount = screens.filter(s => !s.is_draft).length;

  return (
    <div className="space-y-8 max-w-full">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-2">{t.title}</h2>
        <p className="text-zinc-400 text-lg">
          {t.subtitle}
        </p>
      </div>

      {/* Domain / Client selector */}
      {clients.length > 1 && (
        <Card className="dashboard-card border-zinc-800">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">
              {t.domainFilter}
            </p>
            <div className="flex flex-wrap gap-2">
              {clients.map(c => (
                <button
                  key={c.public_id}
                  onClick={() => setSelectedClientId(c.public_id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                    selectedClientId === c.public_id
                      ? 'bg-lime-400/10 border-lime-400/30 text-lime-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  )}
                >
                  {c.allowed_domains}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t.statsTotal, value: screens.length, color: 'text-zinc-300' },
          { label: t.statsDrafts, value: draftsCount, color: 'text-amber-400' },
          { label: t.statsInRag, value: confirmedCount, color: 'text-emerald-400' },
        ].map(s => (
          <Card key={s.label} className="dashboard-card border-zinc-800 bg-zinc-900/30">
            <CardContent className="p-4">
              <p className={cn('text-3xl font-black', s.color)}>{s.value}</p>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
          {(['all', 'draft', 'confirmed'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                filter === f ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {f === 'all' ? t.filterAll : f === 'draft' ? t.statsDrafts : t.statsInRag}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="pl-9 h-9 bg-zinc-900 border-zinc-800 text-sm"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchScreens}
          disabled={loading}
          className="h-9 w-9 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-zinc-900/50 rounded-xl border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="dashboard-card border-zinc-800">
          <CardContent className="p-12 text-center">
            <p className="text-zinc-400 font-bold">
              {search ? t.nothingFound : t.noScreensYet}
            </p>
            <p className="text-zinc-600 text-sm mt-1">
              {search
                ? t.tryAnotherQuery
                : t.adminModeInstruct}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filtered.filter(s => s.is_draft).length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70 px-1 mb-3">
                {t.draftsPending}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.filter(s => s.is_draft).map(s => (
                  <ScreenCard key={s.id} screen={s} onUpdated={handleScreenUpdated} />
                ))}
              </div>
            </div>
          )}
          {filtered.filter(s => !s.is_draft).length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/70 px-1 mt-6 mb-3">
                {t.activeInRag}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.filter(s => !s.is_draft).map(s => (
                  <ScreenCard key={s.id} screen={s} onUpdated={handleScreenUpdated} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
