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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        setClients(res.data as ClientData[]);
      }
    } catch (err) {
      console.error('Failed to fetch clients', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: DomainFormValues) => {
    setError(null);
    try {
      const res = await Organizations.registerClient({
        body: {
          name: data.domain,
          domains: data.domain
        }
      });
      if (res.error) {
        setError(JSON.stringify(res.error));
        return;
      }
      if (res.data && (res.data as any).client) {
        const newClient = (res.data as any).client as ClientData;
        setClients((prev) => [...prev, newClient]);
      } else {
        setError("Invalid response from server: " + JSON.stringify(res.data));
      }
      form.reset();
    } catch (err: any) {
      console.error("Register Error:", err);
      setError(err.message || 'Failed to save domain');
    }
  };

  const removeClient = async (clientId: string) => {
    setError(null);
    try {
      await Organizations.deleteClient({
        path: { client_id: clientId }
      });
      setClients((prev) => prev.filter(c => c.id !== clientId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove domain');
    }
  };

  const copyClientId = (publicId: string) => {
    navigator.clipboard.writeText(publicId);
    setCopiedId(publicId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-zinc-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Settings</h2>
        <p className="text-zinc-400 mt-1">
          Manage your account preferences and your registered domains.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Whitelisted Domains</CardTitle>
          <CardDescription>
            Register each domain separately. Each domain gets its own unique Client ID, and adding a domain triggers automatic processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4 max-w-md">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium leading-none text-zinc-200" htmlFor="domain">
                Add New Domain
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="domain"
                  placeholder="e.g. example.com"
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
              Add
            </Button>
          </form>

          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50">
            {clients.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                No domains whitelisted yet. The widget will not load anywhere.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {clients.map((client) => (
                  <li key={client.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                    <div className="flex items-center">
                      <Globe className="mr-3 h-4 w-4 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-200">{client.allowed_domains}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                       <span className="font-mono text-xs bg-zinc-900 border border-zinc-700 px-2 py-1 rounded">
                         ID: {client.public_id}
                       </span>
                       <Button variant="ghost" size="icon" onClick={() => copyClientId(client.public_id)} className="h-8 w-8 hover:text-white" title="Copy Client ID">
                         {copiedId === client.public_id ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                       </Button>
                       <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeClient(client.id)}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove {client.allowed_domains}</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Your active connection strings for custom server-to-server integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">Advanced API settings are restricted to the Enterprise plan.</p>
        </CardContent>
      </Card>
    </div>
  );
}
