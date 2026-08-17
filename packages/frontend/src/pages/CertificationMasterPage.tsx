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
import { Award, Plus, Edit2, Trash2 } from 'lucide-react';

export const CertificationMasterPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [masters, setMasters] = useState<CertificationMasterDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 新規登録モーダル
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', issuer: '', category: '' });
  const [error, setError] = useState<string | null>(null);

  // 編集モーダル
  const [editingMaster, setEditingMaster] = useState<CertificationMasterDto | null>(null);
  const [editForm, setEditForm] = useState({ name: '', issuer: '', category: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

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

  const handleOpenEdit = (m: CertificationMasterDto) => {
    setEditingMaster(m);
    setEditForm({
      name: m.name,
      issuer: m.issuer || '',
      category: m.category || ''
    });
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaster) return;
    setEditError(null);
    setEditLoading(true);
    try {
      await api.put(`/api/v1/certifications/masters/${editingMaster.id}`, editForm);
      setEditingMaster(null);
      fetchMasters();
    } catch (err: any) {
      setEditError(err.message || '更新に失敗しました。');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`資格マスタ「${name}」を削除しますか？\n（※社員の保有資格として登録済みの場合は削除できません）`)) {
      return;
    }
    try {
      await api.delete(`/api/v1/certifications/masters/${id}`);
      fetchMasters();
    } catch (err: any) {
      alert(err.message || '削除に失敗しました。');
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
                {user?.role === Role.ADMIN && (
                  <th className="px-6 py-3.5 text-right">{t.common.actions}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={user?.role === Role.ADMIN ? 4 : 3} className="px-6 py-8 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : masters.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === Role.ADMIN ? 4 : 3} className="px-6 py-8 text-center text-slate-400">
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
                    {user?.role === Role.ADMIN && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(m)}
                            title={t.common.edit}
                          >
                            <Edit2 className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(m.id, m.name)}
                            title={t.common.delete}
                          >
                            <Trash2 className="w-4 h-4 text-slate-500 hover:text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 新規登録モーダル */}
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

      {/* 編集モーダル */}
      <Dialog
        isOpen={Boolean(editingMaster)}
        onClose={() => setEditingMaster(null)}
        title={t.certMaster.editMaster}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && <Alert variant="danger">{editError}</Alert>}
          <Input
            label={t.certMaster.name}
            required
            placeholder="AWS Certified Solutions Architect"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label={t.certMaster.issuer}
            placeholder="Amazon Web Services, etc."
            value={editForm.issuer}
            onChange={(e) => setEditForm({ ...editForm, issuer: e.target.value })}
          />
          <Input
            label={t.certMaster.category}
            placeholder="Cloud, Database, Security, etc."
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setEditingMaster(null)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" isLoading={editLoading}>{t.common.save}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
