import React, { useEffect, useState } from 'react';
import { useI18n } from '../contexts/I18nContext.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { api } from '../services/api.js';
import { DashboardStatsDto, SkillLevel } from '@skillmatrix/shared';
import {
  Users,
  Building2,
  Award,
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<DashboardStatsDto>('/api/v1/dashboard/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  // Recharts 用データ整形
  const skillChartData = stats.skillLevelDistribution.map((item) => ({
    name: item.level,
    [t.skills.selfLevel]: item.selfCount,
    [t.skills.managerLevel]: item.managerCount
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.dashboard.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t.dashboard.subtitle}
        </p>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.dashboard.totalEmployees}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalEmployees}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.dashboard.departments}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.departmentCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.dashboard.certifications}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.certificationsCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.dashboard.unevaluatedSkills}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.unevaluatedSkillsCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* チャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* スキルレベル分布 (自己 vs 上長) */}
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.skillDistribution}</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey={t.skills.selfLevel} fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t.skills.managerLevel} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 評価ギャップ分布 */}
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.evaluationGap}</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.evaluationGapDistribution}
                  dataKey="count"
                  nameKey="gap"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.gap}: ${entry.count}`}
                >
                  {stats.evaluationGapDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 実務経験年数分布 */}
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.experienceDistribution}</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.experienceYearsDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 資格保有状況 (円グラフ & 一覧) */}
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.certDistribution}</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {stats.certificationsDistribution && stats.certificationsDistribution.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-center">
                <div className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.certificationsDistribution}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {stats.certificationsDistribution.map((_, index) => (
                          <Cell key={`cert-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [`${value}`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-64 pr-2">
                  {stats.certificationsDistribution.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[180px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title={c.name}>
                          {c.name}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                資格保有データがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近更新された社員 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <span>{t.dashboard.recentUpdates}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.recentUpdatedEmployees.map((e) => (
              <div
                key={e.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{e.name}</span>
                  <span className="text-xs text-slate-400">{e.employeeNumber}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{e.departmentName}</p>
                <p className="text-[11px] text-slate-400 mt-2 text-right">
                  {new Date(e.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
