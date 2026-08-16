import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { useI18n } from '../../contexts/I18nContext.js';
import { cn } from '../../lib/utils.js';
import {
  LayoutDashboard,
  Users,
  Search,
  Building2,
  Award,
  ShieldCheck,
  Settings,
  UserCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();

  const navItems = [
    { to: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, roles: ['ADMIN', 'DEPARTMENT_MANAGER'] },
    { to: '/employees', label: t.nav.employees, icon: Users, roles: ['ADMIN', 'DEPARTMENT_MANAGER', 'GENERAL'] },
    { to: '/search', label: t.nav.search, icon: Search, roles: ['ADMIN', 'DEPARTMENT_MANAGER', 'GENERAL'] },
    { to: `/employees/${user?.employeeId}`, label: t.nav.myProfile, icon: UserCheck, roles: ['ADMIN', 'DEPARTMENT_MANAGER', 'GENERAL'] },
    { to: '/departments', label: t.nav.organization, icon: Building2, roles: ['ADMIN'] },
    { to: '/certifications/masters', label: t.nav.certMaster, icon: Award, roles: ['ADMIN'] },
    { to: '/audit-logs', label: t.nav.auditLogs, icon: ShieldCheck, roles: ['ADMIN'] },
    { to: '/settings', label: t.nav.settings, icon: Settings, roles: ['ADMIN', 'DEPARTMENT_MANAGER', 'GENERAL'] }
  ];

  const filteredItems = navItems.filter((item) => !user || item.roles.includes(user.role));

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
