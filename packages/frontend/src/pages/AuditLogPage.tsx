import React, { useEffect, useState } from 'react';
import { useI18n } from '../contexts/I18nContext.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Dialog } from '../components/ui/Dialog.js';
import { Button } from '../components/ui/Button.js';
import { api } from '../services/api.js';
import { AuditLogDto, PaginatedResult, AuditAction } from '@skillmatrix/shared';
import { ShieldCheck, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<PaginatedResult<AuditLogDto>>({
    items: [],
    pagination: { total: 0, page: 1, limit: 50, totalPages: 1, hasMore: false }
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // 差分表示モーダル
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResult<AuditLogDto>>('/api/v1/audit-logs', { page, limit: 50 });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

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
          システム内のすべての変更操作・ログイン履歴（不変ログ）
        </p>
      </div>

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
                    読み込み中...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    監査ログはありません。
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
                          差分
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
              全 {data.pagination.total} 件
            </span>
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

      {/* 差分JSONビューアモーダル */}
      <Dialog
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="監査ログ詳細 (変更スナップショット)"
        maxWidth="2xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 text-slate-500 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <div>操作者: {selectedLog.actorName}</div>
              <div>日時: {new Date(selectedLog.timestamp).toLocaleString()}</div>
              <div>アクション: {selectedLog.action}</div>
              <div>対象: {selectedLog.targetName || selectedLog.targetId}</div>
              <div className="col-span-2">Request ID: {selectedLog.requestId || '-'}</div>
            </div>

            {selectedLog.beforeJson && (
              <div>
                <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">変更前 (Before)</h5>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto font-mono text-[11px]">
                  {JSON.stringify(JSON.parse(selectedLog.beforeJson), null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.afterJson && (
              <div>
                <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">変更後 (After)</h5>
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
