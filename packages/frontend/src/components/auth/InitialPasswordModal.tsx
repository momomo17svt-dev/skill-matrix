import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useI18n } from '../../contexts/I18nContext.js';
import { Dialog } from '../ui/Dialog.js';
import { Input } from '../ui/Input.js';
import { Button } from '../ui/Button.js';
import { Alert } from '../ui/Alert.js';
import { api, ApiError } from '../../services/api.js';

export const InitialPasswordModal: React.FC = () => {
  const { isInitialPassword, setIsInitialPassword } = useAuth();
  const { t } = useI18n();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isInitialPassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('パスワードは8文字以上で設定してください。');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('確認用パスワードが一致しません。');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v1/auth/initial-password-change', {
        newPassword
      });
      setIsInitialPassword(false);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('パスワードの変更に失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isInitialPassword}
      onClose={() => {}} // 初回強制のため外クリックや閉じるボタン無効
      title={t.auth.initialPasswordChangeTitle}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert variant="warning">
          {t.auth.initialPasswordChangeDesc}
        </Alert>

        {error && <Alert variant="danger">{error}</Alert>}

        <div>
          <Input
            type="password"
            label={t.auth.newPassword}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="8文字以上の安全なパスワード"
          />
        </div>

        <div>
          <Input
            type="password"
            label={t.auth.confirmPassword}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="もう一度入力してください"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full" isLoading={loading}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
