import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useI18n } from '../contexts/I18nContext.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Dialog } from '../components/ui/Dialog.js';
import { Alert } from '../components/ui/Alert.js';
import { api } from '../services/api.js';
import { CertificationMasterDto, Role } from '@skillmatrix/shared';
import { Award, Plus } from 'lucide-react';

export const CertificationMasterPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [masters, setMasters] = useState<CertificationMasterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', issuer: '', category: '' });
  const [error, setError] = useState<string | null>(null);

  const fetchMasters = async () => {
    setLoading(true);
    try {
      const data = await api.get<CertificationMasterDto[]>('/api/v1/certifications/masters');
      setMasters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/api/v1/certifications/masters', form);
      setIsOpen(false);
      setForm({ name: '', issuer: '', category: '' });
      fetchMasters();
    } catch (err: any) {
      setError(err.message || '登録に失敗しました。');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.certMaster.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.certMaster.subtitle}
          </p>
        </div>

        {user?.role === Role.ADMIN && (
          <Button onClick={() => setIsOpen(true)} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>{t.certMaster.addMaster}</span>
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">{t.certMaster.name}</th>
                <th className="px-6 py-3.5">{t.certMaster.issuer}</th>
                <th className="px-6 py-3.5">{t.certMaster.category}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : masters.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                    {t.certMaster.noMasters}
                  </td>
                </tr>
              ) : (
                masters.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>{m.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{m.issuer || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{m.category || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title={t.certMaster.addMaster}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <Input
            label={t.certMaster.name}
            required
            placeholder="AWS Certified Solutions Architect"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label={t.certMaster.issuer}
            placeholder="Amazon Web Services, etc."
            value={form.issuer}
            onChange={(e) => setForm({ ...form, issuer: e.target.value })}
          />
          <Input
            label={t.certMaster.category}
            placeholder="Cloud, Database, Security, etc."
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit">{t.common.save}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
