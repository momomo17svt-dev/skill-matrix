import React, { useEffect, useState } from 'react';
import { useI18n } from '../contexts/I18nContext.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Dialog } from '../components/ui/Dialog.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { api } from '../services/api.js';
import { AuditLogDto, PaginatedResult, AuditAction } from '@skillmatrix/shared';
import { ShieldCheck, Eye, ChevronLeft, ChevronRight, Search, RotateCcw } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<PaginatedResult<AuditLogDto>>({
    items: [],
    pagination: { total: 0, page: 1, limit: 50, totalPages: 1, hasMore: false }
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // 検索条件
  const [keyword, setKeyword] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 適用された検索条件
  const [appliedFilters, setAppliedFilters] = useState({
    keyword: '',
    action: '',
    startDate: '',
    endDate: ''
  });

  // 差分表示モーダル
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const fetchLogs = async (targetPage: number = page, targetLimit: number = limit) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResult<AuditLogDto>>('/api/v1/audit-logs', {
        page: targetPage,
        limit: targetLimit,
        keyword: appliedFilters.keyword || undefined,
        action: appliedFilters.action || undefined,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, limit);
  }, [page, limit, appliedFilters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({
      keyword,
      action: selectedAction,
      startDate,
      endDate
    });
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSelectedAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setAppliedFilters({
      keyword: '',
      action: '',
      startDate: '',
      endDate: ''
    });
  };

  const getActionBadgeVariant = (action: AuditAction) => {
    if (action.includes('DELETE') || action.includes('LOCK')) return 'danger';
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE') || action.includes('PASSWORD')) return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.audit.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t.audit.subtitle}
        </p>
      </div>

      {/* 検索・絞り込みフォーム */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder={t.audit.searchPlaceholder}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div>
                <Select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  options={[
                    { value: '', label: t.audit.allActions },
                    ...Object.values(AuditAction).map((act) => ({
                      value: act,
                      label: act
                    }))
                  ]}
                />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title={t.audit.startDate}
                />
                <span className="text-slate-400 text-xs">〜</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title={t.audit.endDate}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t.common.recordsCount}:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value, 10);
                    setLimit(newLimit);
                    setPage(1);
                  }}
                  className="text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded px-2 py-1 focus:outline-none"
                >
                  <option value={20}>20 {t.audit.perPage}</option>
                  <option value={50}>50 {t.audit.perPage}</option>
                  <option value={100}>100 {t.audit.perPage}</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" type="button" onClick={handleResetFilters}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  {t.audit.reset}
                </Button>
                <Button size="sm" type="submit">
                  <Search className="w-3.5 h-3.5 mr-1" />
                  {t.common.search}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">{t.audit.timestamp}</th>
                <th className="px-5 py-3">{t.audit.actor}</th>
                <th className="px-5 py-3">{t.audit.action}</th>
                <th className="px-5 py-3">{t.audit.target}</th>
                <th className="px-5 py-3">{t.audit.ip}</th>
                <th className="px-5 py-3 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    {t.audit.noLogs}
                  </td>
                </tr>
              ) : (
                data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                      {log.actorName}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={getActionBadgeVariant(log.action)} className="text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-sans text-slate-600 dark:text-slate-300">
                      {log.targetName || log.targetEmployeeNumber || log.targetId} ({log.targetType})
                    </td>
                    <td className="px-5 py-3 text-slate-400">{log.ipAddress || '-'}</td>
                    <td className="px-5 py-3 text-right">
                      {(log.beforeJson || log.afterJson) && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          {t.common.details}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {data.pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              全 {data.pagination.total} {t.common.recordsCount} ({(page - 1) * limit + 1}〜{Math.min(page * limit, data.pagination.total)} 件)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                title={t.common.previous}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasMore && page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
                title={t.common.next}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 差分JSONビューアモーダル */}
      <Dialog
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={t.audit.changes}
        maxWidth="2xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 text-slate-500 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <div>{t.audit.actor}: {selectedLog.actorName}</div>
              <div>{t.audit.timestamp}: {new Date(selectedLog.timestamp).toLocaleString()}</div>
              <div>{t.audit.action}: {selectedLog.action}</div>
              <div>{t.audit.target}: {selectedLog.targetName || selectedLog.targetId}</div>
              <div className="col-span-2">{t.audit.requestId}: {selectedLog.requestId || '-'}</div>
            </div>

            {selectedLog.beforeJson && (
              <div>
                <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Before</h5>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto font-mono text-[11px]">
                  {JSON.stringify(JSON.parse(selectedLog.beforeJson), null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.afterJson && (
              <div>
                <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">After</h5>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto font-mono text-[11px]">
                  {JSON.stringify(JSON.parse(selectedLog.afterJson), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};
