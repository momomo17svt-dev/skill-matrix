import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useI18n } from '../contexts/I18nContext.js';
import { Card, CardContent } from '../components/ui/Card.js';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import { Select } from '../components/ui/Select.js';
import { Badge } from '../components/ui/Badge.js';
import { Dialog } from '../components/ui/Dialog.js';
import { api, ApiError } from '../services/api.js';
import {
  EmployeeListItemDto,
  PaginatedResult,
  DepartmentDto,
  Role,
  EmployeeStatus
} from '@skillmatrix/shared';
import {
  Search,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Filter
} from 'lucide-react';

export const EmployeeListPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [data, setData] = useState<PaginatedResult<EmployeeListItemDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);

  // 検索・ページネーション状態
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState('employeeNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 新規登録モーダル
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    employeeNumber: '',
    name: '',
    nameKana: '',
    email: '',
    departmentId: '',
    position: '',
    role: Role.GENERAL,
    hireDate: new Date().toISOString().split('T')[0],
    status: EmployeeStatus.ACTIVE,
    notes: '',
    initialPassword: 'Password123!'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResult<EmployeeListItemDto>>('/api/v1/employees', {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        departmentId: departmentId || undefined,
        status: statusFilter || undefined
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, limit, sortBy, sortOrder, departmentId, statusFilter]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get<DepartmentDto[]>('/api/v1/departments');
        // フラット化
        const flatten = (items: DepartmentDto[]): DepartmentDto[] => {
          let list: DepartmentDto[] = [];
          items.forEach((item) => {
            list.push(item);
            if (item.children) list = list.concat(flatten(item.children));
          });
          return list;
        };
        setDepartments(flatten(res));
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    fetchDepts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      await api.post('/api/v1/employees', createForm);
      setIsCreateOpen(false);
      fetchEmployees();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setCreateError(err.message);
      } else {
        setCreateError('社員の登録に失敗しました。');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: Role) => {
    if (role === Role.ADMIN) return 'danger';
    if (role === Role.DEPARTMENT_MANAGER) return 'warning';
    return 'default';
  };

  const getStatusBadgeVariant = (status: EmployeeStatus) => {
    if (status === EmployeeStatus.ACTIVE) return 'success';
    if (status === EmployeeStatus.ON_LEAVE) return 'warning';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.employee.listTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            組織に所属するエンジニア・社員の検索と管理
          </p>
        </div>

        {user?.role === Role.ADMIN && (
          <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>{t.employee.createTitle}</span>
          </Button>
        )}
      </div>

      {/* 検索・絞り込みフィルター */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Input
                placeholder="氏名・カナ・社員番号・メール"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <Select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">すべての部署</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">すべての状態</option>
                <option value={EmployeeStatus.ACTIVE}>{t.employeeStatus.ACTIVE}</option>
                <option value={EmployeeStatus.ON_LEAVE}>{t.employeeStatus.ON_LEAVE}</option>
                <option value={EmployeeStatus.RETIRED}>{t.employeeStatus.RETIRED}</option>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" className="w-full flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                <span>{t.common.search}</span>
              </Button>
              {(search || departmentId || statusFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setDepartmentId('');
                    setStatusFilter('');
                    setPage(1);
                  }}
                >
                  {t.common.reset}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 社員一覧テーブル */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('employeeNumber')}
                  className="px-6 py-3.5 cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.employee.number}</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3.5 cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.employee.name}</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="px-6 py-3.5">{t.employee.department}</th>
                <th className="px-6 py-3.5">{t.employee.position}</th>
                <th className="px-6 py-3.5">{t.employee.role}</th>
                <th className="px-6 py-3.5">{t.employee.status}</th>
                <th className="px-6 py-3.5 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      <span>{t.common.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    社員が見つかりませんでした。
                  </td>
                </tr>
              ) : (
                data.items.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {emp.employeeNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{emp.name}</div>
                      <div className="text-xs text-slate-400">{emp.nameKana}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {emp.departmentName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {emp.position || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRoleBadgeVariant(emp.role)}>
                        {t.roles[emp.role]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(emp.status)}>
                        {t.employeeStatus[emp.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/employees/${emp.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {t.common.details}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {data && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                全 {data.pagination.total} 件中 {(page - 1) * limit + 1} - {Math.min(page * limit, data.pagination.total)} 件表示
              </span>
              <Select
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="w-24 h-8 text-xs"
              >
                <option value="25">25件</option>
                <option value="50">50件</option>
                <option value="100">100件</option>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasMore}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 新規登録モーダル (ADMIN) */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t.employee.createTitle}
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && <Badge variant="danger" className="w-full p-2">{createError}</Badge>}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.employee.number}
              required
              value={createForm.employeeNumber}
              onChange={(e) => setCreateForm({ ...createForm, employeeNumber: e.target.value })}
              placeholder="EMP001"
            />
            <Input
              label={t.employee.email}
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="taro.yamada@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.employee.name}
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="山田 太郎"
            />
            <Input
              label={t.employee.nameKana}
              required
              value={createForm.nameKana}
              onChange={(e) => setCreateForm({ ...createForm, nameKana: e.target.value })}
              placeholder="ヤマダ タロウ"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t.employee.department}
              required
              value={createForm.departmentId}
              onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
            >
              <option value="">部署を選択してください</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Input
              label={t.employee.position}
              value={createForm.position}
              onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
              placeholder="シニアエンジニア"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label={t.employee.role}
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
            >
              <option value={Role.GENERAL}>{t.roles.GENERAL}</option>
              <option value={Role.DEPARTMENT_MANAGER}>{t.roles.DEPARTMENT_MANAGER}</option>
              <option value={Role.ADMIN}>{t.roles.ADMIN}</option>
            </Select>

            <Input
              label={t.employee.hireDate}
              type="date"
              required
              value={createForm.hireDate}
              onChange={(e) => setCreateForm({ ...createForm, hireDate: e.target.value })}
            />

            <Select
              label={t.employee.status}
              value={createForm.status}
              onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as EmployeeStatus })}
            >
              <option value={EmployeeStatus.ACTIVE}>{t.employeeStatus.ACTIVE}</option>
              <option value={EmployeeStatus.ON_LEAVE}>{t.employeeStatus.ON_LEAVE}</option>
              <option value={EmployeeStatus.RETIRED}>{t.employeeStatus.RETIRED}</option>
            </Select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" isLoading={createLoading}>
              {t.common.create}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
