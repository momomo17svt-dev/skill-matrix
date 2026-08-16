import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useI18n } from '../contexts/I18nContext.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Dialog } from '../components/ui/Dialog.js';
import { Alert } from '../components/ui/Alert.js';
import { api, ApiError } from '../services/api.js';
import {
  DepartmentDto,
  SkillCategoryDto,
  Role
} from '@skillmatrix/shared';
import { Building2, Plus, Edit, Trash2, Layers, FolderPlus, Code } from 'lucide-react';

export const DepartmentManagePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [flatDepts, setFlatDepts] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDept, setSelectedDept] = useState<DepartmentDto | null>(null);
  const [deptSkills, setDeptSkills] = useState<SkillCategoryDto[]>([]);

  // 部署作成/編集モーダル
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({
    id: '',
    code: '',
    name: '',
    parentId: '',
    sortOrder: 0
  });
  const [deptModalLoading, setDeptModalLoading] = useState(false);
  const [deptModalError, setDeptModalError] = useState<string | null>(null);

  // スキル追加モーダル
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [skillForm, setSkillForm] = useState({
    categoryId: '',
    name: '',
    notes: '',
    sortOrder: 0
  });

  // カテゴリ追加モーダル
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({
    name: '',
    sortOrder: 0
  });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const tree = await api.get<DepartmentDto[]>('/api/v1/departments');
      setDepartments(tree);

      const flatten = (items: DepartmentDto[]): DepartmentDto[] => {
        let list: DepartmentDto[] = [];
        items.forEach((item) => {
          list.push(item);
          if (item.children) list = list.concat(flatten(item.children));
        });
        return list;
      };
      const flat = flatten(tree);
      setFlatDepts(flat);

      if (!selectedDept && flat.length > 0) {
        setSelectedDept(flat[0]);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDeptSkills = async (deptId: string) => {
    try {
      const data = await api.get<SkillCategoryDto[]>(`/api/v1/skills/department/${deptId}`);
      setDeptSkills(data);
    } catch (err) {
      console.error('Failed to load department skills:', err);
    }
  };

  useEffect(() => {
    if (selectedDept) {
      fetchDeptSkills(selectedDept.id);
    }
  }, [selectedDept]);

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptModalError(null);
    setDeptModalLoading(true);

    try {
      if (deptForm.id) {
        await api.put(`/api/v1/departments/${deptForm.id}`, {
          code: deptForm.code,
          name: deptForm.name,
          parentId: deptForm.parentId || null,
          sortOrder: deptForm.sortOrder
        });
      } else {
        await api.post('/api/v1/departments', {
          code: deptForm.code,
          name: deptForm.name,
          parentId: deptForm.parentId || null,
          sortOrder: deptForm.sortOrder
        });
      }
      setIsDeptModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      setDeptModalError(err.message || '部署の保存に失敗しました。');
    } finally {
      setDeptModalLoading(false);
    }
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      await api.post('/api/v1/skills/category', {
        departmentId: selectedDept.id,
        name: catForm.name,
        sortOrder: catForm.sortOrder
      });
      setIsCatModalOpen(false);
      setCatForm({ name: '', sortOrder: 0 });
      fetchDeptSkills(selectedDept.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      await api.post('/api/v1/skills', {
        departmentId: selectedDept.id,
        categoryId: skillForm.categoryId,
        name: skillForm.name,
        notes: skillForm.notes,
        sortOrder: skillForm.sortOrder
      });
      setIsSkillModalOpen(false);
      setSkillForm({ categoryId: '', name: '', notes: '', sortOrder: 0 });
      fetchDeptSkills(selectedDept.id);
    } catch (err) {
      console.error(err);
    }
  };

  const renderTree = (items: DepartmentDto[], depth = 0) => {
    return items.map((dept) => (
      <div key={dept.id} className="space-y-1">
        <div
          onClick={() => setSelectedDept(dept)}
          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
            selectedDept?.id === dept.id
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="truncate">{dept.name}</span>
            <span className="text-[10px] font-mono text-slate-400">({dept.code})</span>
          </div>

          <div className="flex items-center gap-1">
            {user?.role === Role.ADMIN && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeptForm({
                    id: dept.id,
                    code: dept.code,
                    name: dept.name,
                    parentId: dept.parentId || '',
                    sortOrder: dept.sortOrder
                  });
                  setIsDeptModalOpen(true);
                }}
                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {dept.children && dept.children.length > 0 && renderTree(dept.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.nav.organization}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            組織階層ツリーおよび部署固有スキルセットの管理
          </p>
        </div>

        {user?.role === Role.ADMIN && (
          <Button
            onClick={() => {
              setDeptForm({ id: '', code: '', name: '', parentId: '', sortOrder: 0 });
              setIsDeptModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>部署を追加</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 組織ツリー */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">組織ツリー</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {loading ? (
              <p className="text-xs text-slate-400 p-4 text-center">読み込み中...</p>
            ) : (
              renderTree(departments)
            )}
          </CardContent>
        </Card>

        {/* 選択した部署のスキルセット定義 */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                {selectedDept ? `${selectedDept.name} のスキルセット` : '部署を選択してください'}
              </CardTitle>
              {selectedDept && (
                <p className="text-xs text-slate-400 mt-0.5">
                  階層パス: {selectedDept.path} (所属社員: {selectedDept.employeeCount || 0}名)
                </p>
              )}
            </div>

            {selectedDept && (user?.role === Role.ADMIN || user?.role === Role.DEPARTMENT_MANAGER) && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsCatModalOpen(true)}>
                  <FolderPlus className="w-3.5 h-3.5 mr-1" />
                  カテゴリ追加
                </Button>
                <Button size="sm" onClick={() => setIsSkillModalOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  スキル追加
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {deptSkills.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                この部署にはスキルが定義されていません。「カテゴリ追加」「スキル追加」から登録してください。
              </div>
            ) : (
              deptSkills.map((cat) => (
                <div key={cat.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>{cat.name}</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.skills.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                          <span>{s.name}</span>
                        </div>
                        {s.notes && <p className="text-slate-500">{s.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 部署作成/編集モーダル */}
      <Dialog
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={deptForm.id ? '部署の編集' : '部署の新規作成'}
      >
        <form onSubmit={handleDeptSubmit} className="space-y-4">
          {deptModalError && <Alert variant="danger">{deptModalError}</Alert>}

          <Input
            label="部署コード"
            required
            placeholder="DEV-1"
            value={deptForm.code}
            onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
          />

          <Input
            label="部署名"
            required
            placeholder="第1開発部"
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />

          <Select
            label="親部署 (未指定でルート)"
            value={deptForm.parentId}
            onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
          >
            <option value="">ルート部署 (親なし)</option>
            {flatDepts
              .filter((d) => d.id !== deptForm.id)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
          </Select>

          <Input
            label="表示順"
            type="number"
            value={String(deptForm.sortOrder)}
            onChange={(e) => setDeptForm({ ...deptForm, sortOrder: Number(e.target.value) })}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsDeptModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" isLoading={deptModalLoading}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* カテゴリ追加モーダル */}
      <Dialog isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="スキルカテゴリの追加">
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <Input
            label="カテゴリ名"
            required
            placeholder="バックエンド言語 & DB"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
          />
          <Input
            label="表示順"
            type="number"
            value={String(catForm.sortOrder)}
            onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsCatModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit">{t.common.save}</Button>
          </div>
        </form>
      </Dialog>

      {/* スキル追加モーダル */}
      <Dialog isOpen={isSkillModalOpen} onClose={() => setIsSkillModalOpen(false)} title="スキル定義の追加">
        <form onSubmit={handleSkillSubmit} className="space-y-4">
          <Select
            label="所属カテゴリ"
            required
            value={skillForm.categoryId}
            onChange={(e) => setSkillForm({ ...skillForm, categoryId: e.target.value })}
          >
            <option value="">カテゴリを選択してください</option>
            {deptSkills.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="スキル名"
            required
            placeholder="C# / .NET Core"
            value={skillForm.name}
            onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
          />

          <Input
            label="備考 / 説明"
            placeholder="ASP.NET Core, EF Core などの実務経験"
            value={skillForm.notes}
            onChange={(e) => setSkillForm({ ...skillForm, notes: e.target.value })}
          />

          <Input
            label="表示順"
            type="number"
            value={String(skillForm.sortOrder)}
            onChange={(e) => setSkillForm({ ...skillForm, sortOrder: Number(e.target.value) })}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsSkillModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit">{t.common.save}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
