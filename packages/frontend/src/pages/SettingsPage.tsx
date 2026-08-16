import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useI18n } from '../contexts/I18nContext.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Alert } from '../components/ui/Alert.js';
import { api, ApiError } from '../services/api.js';
import { Globe, Moon, Lock, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  // パスワード変更
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(false);
    setPwdError(null);

    if (newPassword.length < 8) {
      setPwdError('新しいパスワードは8文字以上で入力してください。');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('確認用パスワードが一致しません。');
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/api/v1/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPwdSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setPwdError(err.message);
      } else {
        setPwdError('パスワードの変更に失敗しました。');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.settings.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          言語設定、表示テーマ、セキュリティ設定の管理
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 表示・言語設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>表示・地域設定</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.settings.language}
              </label>
              <Select value={locale} onChange={(e) => setLocale(e.target.value as any)}>
                <option value="ja">日本語 (Japanese)</option>
                <option value="en">English (US)</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.settings.theme}
              </label>
              <Select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
                <option value="system">{t.settings.themeSystem}</option>
                <option value="light">{t.settings.themeLight}</option>
                <option value="dark">{t.settings.themeDark}</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* パスワード変更 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>{t.auth.changePassword}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwdSuccess && <Alert variant="success">{t.auth.passwordChanged}</Alert>}
              {pwdError && <Alert variant="danger">{pwdError}</Alert>}

              <Input
                label={t.auth.currentPassword}
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />

              <Input
                label={t.auth.newPassword}
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Input
                label={t.auth.confirmPassword}
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="pt-2">
                <Button type="submit" isLoading={pwdLoading} className="w-full">
                  {t.common.save}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
