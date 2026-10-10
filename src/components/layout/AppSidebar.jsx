import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Network,
  ShieldCheck,
  FileCheck2,
  ScrollText,
  Shield,
  Zap,
  Lock
} from 'lucide-react';

export function AppSidebar({
  currentPath,
  onNavigate,
  activeIncidentsCount = 0,
  pendingContainmentCount = 0
}) {
  const navItems = [
    {
      name: 'Overview',
      path: '/',
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'Incidents',
      path: '/incidents',
      icon: ShieldAlert,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : null,
      badgeColor: 'bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5]'
    },
    {
      name: 'Threat Graph',
      path: '/threat-graph',
      icon: Network,
      badge: null
    },
    {
      name: 'Containment',
      path: '/containment',
      icon: ShieldCheck,
      badge: pendingContainmentCount > 0 ? pendingContainmentCount : null,
      badgeColor: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
    },
    {
      name: 'Forensics',
      path: '/forensics',
      icon: FileCheck2,
      badge: null
    },
    {
      name: 'Audit Ledger',
      path: '/audit-ledger',
      icon: ScrollText,
      badge: null
    }
  ];

  return (
    <aside className="w-[252px] bg-white border-r border-[#E1E5ED] flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-78px)] select-none">
      {/* TOP NAVIGATION SECTION */}
      <div className="p-4 space-y-6">
        {/* Navigation Category Label */}
        <div>
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#8995AA] px-3">
            OPERATIONS COMMAND
          </span>

          {/* Nav List */}
          <nav className="mt-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#FFF1F0] text-[#C9362B] border border-[#FCA5A5] shadow-sm'
                      : 'text-[#172033] hover:bg-[#F5F5F9] hover:text-[#172033] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#C9362B]' : 'text-[#718096]'}`} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-[#F5F5F9] text-[#718096]'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* BOTTOM AGENT STATUS BADGE */}
      <div className="p-4 border-t border-[#E1E5ED]">
        <div className="p-3.5 rounded-xl bg-[#F5F5F9] border border-[#E1E5ED] space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFF1F0] border border-[#FCA5A5] flex items-center justify-center text-[#C9362B]">
              <Shield className="w-4 h-4 fill-[#C9362B]/10" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172033] leading-tight">
                SENTINEL AGENT v2.4
              </div>
              <div className="text-[10px] font-mono text-[#718096]">
                Demo Verification Rig
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-[#E1E5ED]/80">
            <span className="w-2 h-2 rounded-full bg-[#4F9D60] animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold text-[#172033] uppercase tracking-wider">
              AUTONOMOUS DANGER MODE: ARMED
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
