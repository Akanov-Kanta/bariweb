'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Globe, Plus } from 'lucide-react';
import { Organizations } from '@/lib/api/sdk.gen'; // we might use this

const domainSchema = z.object({
  domain: z.string().min(1, 'Domain is required').url('Must be a valid URL or hostname').or(
    z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/, 'Must be a valid domain name like example.com')
  ),
});

type DomainFormValues = z.infer<typeof domainSchema>;

export default function SettingsPage() {
  const [domains, setDomains] = useState<string[]>(['example.com', 'myapp.io']);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DomainFormValues>({
    resolver: zodResolver(domainSchema),
    defaultValues: { domain: '' },
  });

  const onSubmit = async (data: DomainFormValues) => {
    setError(null);
    try {
      // Mock API call
      // await Organizations.registerClient({ body: { url: data.domain } });
      
      if (!domains.includes(data.domain)) {
        setDomains([...domains, data.domain]);
      }
      form.reset();
    } catch (err: any) {
      setError(err.message || 'Failed to add domain');
    }
  };

  const removeDomain = (domainToRemove: string) => {
    setDomains(domains.filter(d => d !== domainToRemove));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Settings</h2>
        <p className="text-zinc-400 mt-1">
          Manage your account preferences and security configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Whitelisted Domains</CardTitle>
          <CardDescription>
            The AccessLayer widget will ONLY load on domains listed below. Attempts to load the widget on unauthorized domains will be blocked.
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
            {domains.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                No domains whitelisted yet. The widget will not load anywhere.
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
                      <span className="sr-only">Remove {domain}</span>
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
