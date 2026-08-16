import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { api } from '../services/api.js';
import {
  SearchResultEmployeeDto,
  PaginatedResult,
  DepartmentDto,
  SkillLevel
} from '@skillmatrix/shared';
import { Search, RotateCcw, ChevronRight, UserCheck, Award, Briefcase, Code2 } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PaginatedResult<SearchResultEmployeeDto> | null>(null);

  // 検索条件
  const [filter, setFilter] = useState({
    name: '',
    employeeNumber: '',
    departmentId: '',
    includeSubDepartments: true,
    position: '',
    certificationName: '',
    skillName: '',
    selfLevel: '' as SkillLevel | '',
    managerLevel: '' as SkillLevel | '',
    minExperienceYears: '' as number | '',
    usedTechnology: ''
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get<DepartmentDto[]>('/api/v1/departments');
        const flatten = (items: DepartmentDto[]): DepartmentDto[] => {
          let list: DepartmentDto[] = [];
          items.forEach((item) => {
            list.push(item);
            if (item.children) list = list.concat(flatten(item.children));
          });
          return list;
        };
        setDepartments(flatten(res));
      } catch (err) {}
    };
    fetchDepts();
  }, []);

  const handleSearch = async (e?: React.FormEvent, newPage = page) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const cleanFilter: any = {};
      Object.entries(filter).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          cleanFilter[k] = v;
        }
      });

      const res = await api.post<PaginatedResult<SearchResultEmployeeDto>>('/api/v1/search', {
        page: newPage,
        limit,
        filter: cleanFilter
      });
      setResults(res);
      setPage(newPage);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilter({
      name: '',
      employeeNumber: '',
      departmentId: '',
      includeSubDepartments: true,
      position: '',
      certificationName: '',
      skillName: '',
      selfLevel: '',
      managerLevel: '',
      minExperienceYears: '',
      usedTechnology: ''
    });
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.search.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          スキル評価・実務経験年数（重複期間除外）・保有資格を複合した高精度な人材検索
        </p>
      </div>

      {/* 検索条件フォーム */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            <span>{t.search.conditions}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSearch(e, 1)} className="space-y-4">
            {/* 基本属性 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="氏名・カナ"
                placeholder="山田 太郎"
                value={filter.name}
                onChange={(e) => setFilter({ ...filter, name: e.target.value })}
              />
              <Input
                label="社員番号"
                placeholder="EMP001"
                value={filter.employeeNumber}
                onChange={(e) => setFilter({ ...filter, employeeNumber: e.target.value })}
              />
              <Select
                label="部署"
                value={filter.departmentId}
                onChange={(e) => setFilter({ ...filter, departmentId: e.target.value })}
              >
                <option value="">すべての部署</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* スキル・評価条件 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4" />
                <span>{t.search.skillCondition}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="スキル名 (部分一致)"
                  placeholder="C#, React, AWS 等"
                  value={filter.skillName}
                  onChange={(e) => setFilter({ ...filter, skillName: e.target.value })}
                />
                <Select
                  label="自己評価レベル"
                  value={filter.selfLevel}
                  onChange={(e) => setFilter({ ...filter, selfLevel: e.target.value as SkillLevel })}
                >
                  <option value="">指定なし</option>
                  <option value={SkillLevel.A}>{t.skillLevels.A}</option>
                  <option value={SkillLevel.B}>{t.skillLevels.B}</option>
                  <option value={SkillLevel.C}>{t.skillLevels.C}</option>
                </Select>
                <Select
                  label="所属長評価レベル"
                  value={filter.managerLevel}
                  onChange={(e) => setFilter({ ...filter, managerLevel: e.target.value as SkillLevel })}
                >
                  <option value="">指定なし</option>
                  <option value={SkillLevel.A}>{t.skillLevels.A}</option>
                  <option value={SkillLevel.B}>{t.skillLevels.B}</option>
                  <option value={SkillLevel.C}>{t.skillLevels.C}</option>
                </Select>
              </div>
            </div>

            {/* 実務経験 & 資格条件 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="使用技術 (実務案件)"
                placeholder="Java, Python, Docker 等"
                value={filter.usedTechnology}
                onChange={(e) => setFilter({ ...filter, usedTechnology: e.target.value })}
              />
              <Input
                label="通算実務経験年数以上 (年)"
                type="number"
                min={0}
                step={0.5}
                placeholder="例: 3"
                value={filter.minExperienceYears === '' ? '' : String(filter.minExperienceYears)}
                onChange={(e) =>
                  setFilter({ ...filter, minExperienceYears: e.target.value ? Number(e.target.value) : '' })
                }
              />
              <Input
                label="保有資格名 (部分一致)"
                placeholder="AWS, 応用情報, データベース 等"
                value={filter.certificationName}
                onChange={(e) => setFilter({ ...filter, certificationName: e.target.value })}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="outline" type="button" onClick={handleReset} className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                <span>{t.common.reset}</span>
              </Button>
              <Button type="submit" isLoading={loading} className="flex items-center gap-1.5 px-6">
                <Search className="w-4 h-4" />
                <span>{t.common.search}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 検索結果 */}
      {results && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {t.search.results} ({results.pagination.total} 件)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {results.items.length === 0 ? (
              <div className="p-8 text-center text-slate-400">{t.search.noResults}</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.items.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-400">{emp.employeeNumber}</span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{emp.name}</h4>
                        <span className="text-xs text-slate-500">{emp.departmentName}</span>
                        {emp.position && <Badge variant="outline">{emp.position}</Badge>}
                      </div>

                      {/* 該当スキル */}
                      {emp.matchedSkills && emp.matchedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {emp.matchedSkills.map((ms, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium"
                            >
                              {ms.skillName}: 自己[{ms.selfLevel}] / 上長[{ms.managerLevel}]
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 該当資格 & 経験 */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {emp.experienceFormatted && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            実稼働経験: <strong className="text-slate-700 dark:text-slate-300">{emp.experienceFormatted}</strong>
                          </span>
                        )}
                        {emp.matchedCertifications && emp.matchedCertifications.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            資格: {emp.matchedCertifications.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <span>詳細</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
