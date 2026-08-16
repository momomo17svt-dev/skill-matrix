import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { I18nProvider } from './contexts/I18nContext.js';
import { AuthProvider } from './contexts/AuthContext.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { AppLayout } from './components/layout/AppLayout.js';

import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { EmployeeListPage } from './pages/EmployeeListPage.js';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { DepartmentManagePage } from './pages/DepartmentManagePage.js';
import { CertificationMasterPage } from './pages/CertificationMasterPage.js';
import { AuditLogPage } from './pages/AuditLogPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { Role } from '@skillmatrix/shared';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* 公開ルート */}
              <Route path="/login" element={<LoginPage />} />

              {/* 認証保護ルート */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/employees" element={<EmployeeListPage />} />
                  <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* ADMIN 専用ルート */}
                  <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
                    <Route path="/departments" element={<DepartmentManagePage />} />
                    <Route path="/certifications/masters" element={<CertificationMasterPage />} />
                    <Route path="/audit-logs" element={<AuditLogPage />} />
                  </Route>
                </Route>
              </Route>

              {/* 既定ルート */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};
