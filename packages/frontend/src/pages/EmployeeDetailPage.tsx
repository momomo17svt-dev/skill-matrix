import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useI18n } from '../contexts/I18nContext.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Tabs } from '../components/ui/Tabs.js';
import { Dialog } from '../components/ui/Dialog.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Alert } from '../components/ui/Alert.js';
import { api, ApiError } from '../services/api.js';
import {
  EmployeeDetailDto,
  Role,
  SkillLevel,
  CertificationMasterDto,
  SkillEvaluationHistoryDto,
  formatExperience
} from '@skillmatrix/shared';
import {
  User,
  Building2,
  Calendar,
  Mail,
  Award,
  Briefcase,
  Layers,
  History,
  Download,
  Plus,
  Trash2,
  Edit,
  FileText,
  Clock
} from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<EmployeeDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('skills');

  // 資格マスタ一覧
  const [certMasters, setCertMasters] = useState<CertificationMasterDto[]>([]);

  // 評価履歴
  const [histories, setHistories] = useState<SkillEvaluationHistoryDto[]>([]);

  // 資格追加モーダル
  const [isAddCertOpen, setIsAddCertOpen] = useState(false);
  const [certForm, setCertForm] = useState({
    certificationMasterId: '',
    customCertificationName: '',
    acquiredDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    certificateNumber: '',
    notes: ''
  });
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  // 実務経歴追加モーダル
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
  const [workForm, setWorkForm] = useState({
    projectName: '',
    description: '',
    role: '',
    startYearMonth: '',
    endYearMonth: '',
    isCurrent: false,
    notes: '',
    skillsInput: ''
  });
  const [workLoading, setWorkLoading] = useState(false);
  const [workError, setWorkError] = useState<string | null>(null);

  // スキル評価モーダル
  const [evalModal, setEvalModal] = useState<{
    isOpen: boolean;
    skillId: string;
    skillName: string;
    type: 'SELF' | 'MANAGER';
    level: SkillLevel;
    reason: string;
  }>({
    isOpen: false,
    skillId: '',
    skillName: '',
    type: 'SELF',
    level: SkillLevel.UNEVALUATED,
    reason: ''
  });
  const [evalLoading, setEvalLoading] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.get<EmployeeDetailDto>(`/api/v1/employees/${id}`);
      setEmployee(data);
    } catch (err: any) {
      console.error('Failed to load employee:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const masters = await api.get<CertificationMasterDto[]>('/api/v1/certifications/masters');
        setCertMasters(masters);
      } catch (err) {}
    };
    loadMasters();
  }, []);

  const loadHistories = async () => {
    if (!id) return;
    try {
      const data = await api.get<SkillEvaluationHistoryDto[]>(`/api/v1/skills/evaluations/history/${id}`);
      setHistories(data);
    } catch (err) {}
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistories();
    }
  }, [activeTab, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!employee) {
    return <Alert variant="danger">社員情報が見つかりませんでした。</Alert>;
  }

  const isSelf = user?.employeeId === employee.id;
  const canManage = user?.role === Role.ADMIN || (user?.role === Role.DEPARTMENT_MANAGER && !isSelf);

  // 資格追加ハンドラ
  const handleAddCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertError(null);
    setCertLoading(true);

    try {
      const formData = new FormData();
      if (certForm.certificationMasterId) formData.append('certificationMasterId', certForm.certificationMasterId);
      if (certForm.customCertificationName) formData.append('customCertificationName', certForm.customCertificationName);
      formData.append('acquiredDate', certForm.acquiredDate);
      if (certForm.expirationDate) formData.append('expirationDate', certForm.expirationDate);
      if (certForm.certificateNumber) formData.append('certificateNumber', certForm.certificateNumber);
      if (certForm.notes) formData.append('notes', certForm.notes);
      if (certFile) formData.append('file', certFile);

      await api.post(`/api/v1/certifications/employee/${employee.id}`, formData);
      setIsAddCertOpen(false);
      setCertFile(null);
      fetchDetail();
    } catch (err: any) {
      setCertError(err.message || '資格の登録に失敗しました。');
    } finally {
      setCertLoading(false);
    }
  };

  // 実務経歴追加ハンドラ
  const handleAddWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorkError(null);
    setWorkLoading(true);

    try {
      const skills = workForm.skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((skillName) => ({ skillName }));

      await api.post(`/api/v1/work-histories/employee/${employee.id}`, {
        projectName: workForm.projectName,
        description: workForm.description,
        role: workForm.role,
        startYearMonth: workForm.startYearMonth,
        endYearMonth: workForm.isCurrent ? null : workForm.endYearMonth,
        isCurrent: workForm.isCurrent,
        notes: workForm.notes,
        skills
      });

      setIsAddWorkOpen(false);
      fetchDetail();
    } catch (err: any) {
      setWorkError(err.message || '実務経歴の登録に失敗しました。');
    } finally {
      setWorkLoading(false);
    }
  };

  // スキル評価更新ハンドラ
  const handleEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvalLoading(true);

    try {
      const endpoint = evalModal.type === 'SELF' ? '/api/v1/skills/evaluations/self' : '/api/v1/skills/evaluations/manager';
      await api.post(endpoint, {
        employeeId: employee.id,
        skillId: evalModal.skillId,
        level: evalModal.level,
        reason: evalModal.reason
      });

      setEvalModal({ ...evalModal, isOpen: false });
      fetchDetail();
    } catch (err) {
      console.error('Failed to submit evaluation:', err);
    } finally {
      setEvalLoading(false);
    }
  };

  const getLevelBadge = (level: SkillLevel) => {
    if (level === SkillLevel.A) return <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold">A: 指導可能</span>;
    if (level === SkillLevel.B) return <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold">B: 単独遂行</span>;
    if (level === SkillLevel.C) return <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold">C: 支援必要</span>;
    return <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-medium">未評価</span>;
  };

  return (
    <div className="space-y-6">
      {/* 基本情報ヘッダー */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-500/20 shrink-0">
                {employee.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{employee.name}</h1>
                  <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-600 dark:text-slate-400">
                    {employee.employeeNumber}
                  </span>
                  <Badge variant={employee.role === 'ADMIN' ? 'danger' : employee.role === 'DEPARTMENT_MANAGER' ? 'warning' : 'default'}>
                    {t.roles[employee.role]}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{employee.nameKana}</p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {employee.departmentName}
                  </span>
                  {employee.position && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {employee.position}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {employee.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    入社: {employee.hireDate}
                  </span>
                </div>
              </div>
            </div>

            {user?.role === Role.ADMIN && (
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (confirm(t.employee.deleteConfirm)) {
                      await api.delete(`/api/v1/employees/${employee.id}`);
                      navigate('/employees');
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t.common.delete}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* タブナビゲーション */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'skills', label: t.employee.skillsTab, count: employee.skills.length },
          { id: 'certifications', label: t.employee.certificationsTab, count: employee.certifications.length },
          { id: 'workHistories', label: t.employee.workHistoriesTab, count: employee.workHistories.length },
          { id: 'history', label: t.employee.historyTab }
        ]}
      />

      {/* 1. スキルマトリクスタブ */}
      {activeTab === 'skills' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{employee.departmentName} 固有スキル評価マトリクス</CardTitle>
            <span className="text-xs text-slate-400">自己評価と所属長評価を並列表示</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">{t.skills.category}</th>
                  <th className="px-6 py-3">{t.skills.skillName}</th>
                  <th className="px-6 py-3">{t.skills.selfLevel}</th>
                  <th className="px-6 py-3">{t.skills.managerLevel}</th>
                  <th className="px-6 py-3 text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employee.skills.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      {t.skills.noSkills}
                    </td>
                  </tr>
                ) : (
                  employee.skills.map((sk) => (
                    <tr key={sk.skillId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 text-xs">
                        {sk.categoryName}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {sk.skillName}
                      </td>
                      <td className="px-6 py-4">
                        {getLevelBadge(sk.selfLevel)}
                        {sk.selfEvaluatedAt && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(sk.selfEvaluatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getLevelBadge(sk.managerLevel)}
                        {sk.managerEvaluatedAt && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(sk.managerEvaluatedAt).toLocaleDateString()} (by {sk.managerEvaluatorName || '上長'})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {isSelf && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEvalModal({
                                isOpen: true,
                                skillId: sk.skillId,
                                skillName: sk.skillName,
                                type: 'SELF',
                                level: sk.selfLevel,
                                reason: ''
                              })
                            }
                          >
                            自己評価
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              setEvalModal({
                                isOpen: true,
                                skillId: sk.skillId,
                                skillName: sk.skillName,
                                type: 'MANAGER',
                                level: sk.managerLevel,
                                reason: ''
                              })
                            }
                          >
                            上長評価
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2. 保有資格タブ */}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {(isSelf || canManage) && (
              <Button onClick={() => setIsAddCertOpen(true)} className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>{t.certifications.addCert}</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employee.certifications.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="p-8 text-center text-slate-400">
                  {t.certifications.noCerts}
                </CardContent>
              </Card>
            ) : (
              employee.certifications.map((c) => (
                <Card key={c.id} className="relative group">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100">{c.certificationName}</h4>
                          {c.issuer && <p className="text-xs text-slate-500">{c.issuer}</p>}
                        </div>
                      </div>

                      {(isSelf || canManage) && (
                        <button
                          onClick={async () => {
                            if (confirm('この資格情報を削除しますか？')) {
                              await api.delete(`/api/v1/certifications/${c.id}`);
                              fetchDetail();
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>取得日: {c.acquiredDate}</div>
                      <div>期限: {c.expirationDate || 'なし'}</div>
                      {c.certificateNumber && <div className="col-span-2">番号: {c.certificateNumber}</div>}
                    </div>

                    {c.attachment && (
                      <div className="pt-2">
                        <a
                          href={`/api/v1/certifications/attachments/${c.attachment.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{c.attachment.originalFileName} ({(c.attachment.fileSize / 1024).toFixed(1)} KB)</span>
                          <Download className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. 実務経歴タブ */}
      {activeTab === 'workHistories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {(isSelf || canManage) && (
              <Button onClick={() => setIsAddWorkOpen(true)} className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>{t.workHistory.addWork}</span>
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {employee.workHistories.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-slate-400">
                  {t.workHistory.noWork}
                </CardContent>
              </Card>
            ) : (
              employee.workHistories.map((w) => (
                <Card key={w.id}>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{w.projectName}</h4>
                          {w.role && <Badge variant="info">{w.role}</Badge>}
                          {w.isCurrent && <Badge variant="success">進行中</Badge>}
                        </div>
                        <p className="text-xs font-mono text-slate-500 mt-1">
                          {w.startYearMonth} 〜 {w.isCurrent ? '現在' : w.endYearMonth}
                        </p>
                      </div>

                      {(isSelf || canManage) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm('この実務経歴を削除しますか？')) {
                              await api.delete(`/api/v1/work-histories/${w.id}`);
                              fetchDetail();
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {w.description && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        {w.description}
                      </p>
                    )}

                    {w.skills && w.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {w.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                          >
                            {s.skillName}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. 評価履歴タブ */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>{t.skills.historyTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {histories.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">履歴データはありません。</p>
            ) : (
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6">
                {histories.map((h) => (
                  <div key={h.id} className="relative pl-6">
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{h.skillName}</span>
                        <Badge variant={h.evalType === 'SELF' ? 'info' : 'warning'}>
                          {h.evalType === 'SELF' ? '自己評価' : '所属長評価'}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {new Date(h.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <span>変更: {h.previousLevel} → <strong className="text-indigo-600 dark:text-indigo-400">{h.newLevel}</strong></span>
                        <span>(評価者: {h.evaluatorName})</span>
                      </div>
                      {h.reason && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg mt-1.5">
                          理由: {h.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* スキル評価モーダル */}
      <Dialog
        isOpen={evalModal.isOpen}
        onClose={() => setEvalModal({ ...evalModal, isOpen: false })}
        title={`${evalModal.skillName} の${evalModal.type === 'SELF' ? '自己評価' : '所属長評価'}`}
      >
        <form onSubmit={handleEvalSubmit} className="space-y-4">
          <div>
            <Select
              label="評価レベル"
              value={evalModal.level}
              onChange={(e) => setEvalModal({ ...evalModal, level: e.target.value as SkillLevel })}
            >
              <option value={SkillLevel.UNEVALUATED}>{t.skillLevels.UNEVALUATED}</option>
              <option value={SkillLevel.A}>{t.skillLevels.A}</option>
              <option value={SkillLevel.B}>{t.skillLevels.B}</option>
              <option value={SkillLevel.C}>{t.skillLevels.C}</option>
            </Select>
          </div>

          <div>
            <Input
              label={t.skills.reason}
              placeholder="評価理由や根拠・直近の実績を入力してください"
              value={evalModal.reason}
              onChange={(e) => setEvalModal({ ...evalModal, reason: e.target.value })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setEvalModal({ ...evalModal, isOpen: false })}>
              {t.common.cancel}
            </Button>
            <Button type="submit" isLoading={evalLoading}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 資格追加モーダル */}
      <Dialog
        isOpen={isAddCertOpen}
        onClose={() => setIsAddCertOpen(false)}
        title={t.certifications.addCert}
        maxWidth="lg"
      >
        <form onSubmit={handleAddCertSubmit} className="space-y-4">
          {certError && <Alert variant="danger">{certError}</Alert>}

          <div>
            <Select
              label="資格マスタから選択"
              value={certForm.certificationMasterId}
              onChange={(e) => setCertForm({ ...certForm, certificationMasterId: e.target.value })}
            >
              <option value="">マスタから選択（または下で自由入力）</option>
              {certMasters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.issuer || '発行機関なし'})
                </option>
              ))}
            </Select>
          </div>

          {!certForm.certificationMasterId && (
            <div>
              <Input
                label="資格名 (自由入力)"
                placeholder="資格名を入力"
                value={certForm.customCertificationName}
                onChange={(e) => setCertForm({ ...certForm, customCertificationName: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.certifications.acquiredDate}
              type="date"
              required
              value={certForm.acquiredDate}
              onChange={(e) => setCertForm({ ...certForm, acquiredDate: e.target.value })}
            />
            <Input
              label={t.certifications.expirationDate}
              type="date"
              value={certForm.expirationDate}
              onChange={(e) => setCertForm({ ...certForm, expirationDate: e.target.value })}
            />
          </div>

          <div>
            <Input
              label={t.certifications.certNumber}
              placeholder="認定番号等"
              value={certForm.certificateNumber}
              onChange={(e) => setCertForm({ ...certForm, certificateNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.certifications.attachment} (PDF, PNG, JPG / 最大10MB)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setCertFile(e.target.files[0]);
                }
              }}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsAddCertOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" isLoading={certLoading}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 実務経歴追加モーダル */}
      <Dialog
        isOpen={isAddWorkOpen}
        onClose={() => setIsAddWorkOpen(false)}
        title={t.workHistory.addWork}
        maxWidth="lg"
      >
        <form onSubmit={handleAddWorkSubmit} className="space-y-4">
          {workError && <Alert variant="danger">{workError}</Alert>}

          <div>
            <Input
              label={t.workHistory.projectName}
              required
              placeholder="案件・プロジェクト名"
              value={workForm.projectName}
              onChange={(e) => setWorkForm({ ...workForm, projectName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.workHistory.startYearMonth}
              required
              placeholder="2023-04"
              value={workForm.startYearMonth}
              onChange={(e) => setWorkForm({ ...workForm, startYearMonth: e.target.value })}
            />
            {!workForm.isCurrent && (
              <Input
                label={t.workHistory.endYearMonth}
                placeholder="2024-03"
                value={workForm.endYearMonth}
                onChange={(e) => setWorkForm({ ...workForm, endYearMonth: e.target.value })}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCurrent"
              checked={workForm.isCurrent}
              onChange={(e) => setWorkForm({ ...workForm, isCurrent: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <label htmlFor="isCurrent" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.workHistory.isCurrent}
            </label>
          </div>

          <div>
            <Input
              label={t.workHistory.role}
              placeholder="リーダー, バックエンド開発, アーキテクト等"
              value={workForm.role}
              onChange={(e) => setWorkForm({ ...workForm, role: e.target.value })}
            />
          </div>

          <div>
            <Input
              label="使用技術・スキル (カンマ区切り)"
              placeholder="C#, React, TypeScript, SQL Server"
              value={workForm.skillsInput}
              onChange={(e) => setWorkForm({ ...workForm, skillsInput: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.workHistory.description}
            </label>
            <textarea
              rows={3}
              value={workForm.description}
              onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="業務内容・担当範囲など"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsAddWorkOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" isLoading={workLoading}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
