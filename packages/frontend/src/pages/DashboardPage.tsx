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
    自己評価: item.selfCount,
    上長評価: item.managerCount
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.dashboard.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          システム開発組織の人材・スキル・資格の現状集計
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
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalEmployees} 名</h3>
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
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.departmentCount} 組織</h3>
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
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.certificationsCount} 件</h3>
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
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.unevaluatedSkillsCount} 件</h3>
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
                <Bar dataKey="自己評価" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="上長評価" fill="#10b981" radius={[4, 4, 0, 0]} />
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
                  label={(entry) => `${entry.gap}: ${entry.count}件`}
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

        {/* 資格保有トップ & 最近更新 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.certDistribution}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.certificationsDistribution.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[280px]">
                    {c.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {c.count} 名
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.recentUpdates}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {stats.recentUpdatedEmployees.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{e.name}</span>
                    <span className="text-slate-400 ml-2">({e.employeeNumber})</span>
                    <p className="text-slate-500 dark:text-slate-400">{e.departmentName}</p>
                  </div>
                  <span className="text-slate-400">{new Date(e.updatedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
