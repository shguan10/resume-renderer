import React from 'react';
import { Home, Dumbbell, BarChart2, Trophy, User, Users, Vote, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type AppTab = 'home' | 'skills' | 'stats' | 'leaderboard' | 'profile' | 'friends' | 'vote-features';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const navItems: { id: AppTab; label: string; icon: React.ElementType }[] = [
  { id: 'home',        label: 'Home',        icon: Home },
  { id: 'skills',      label: 'Skills',      icon: Dumbbell },
  { id: 'stats',       label: 'Stats',       icon: BarChart2 },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'friends',     label: 'Friends',     icon: Users },
  { id: 'profile',     label: 'Profile',     icon: User },
  { id: 'vote-features',        label: 'Vote on new features!', icon: Vote },
];

export function AppSidebar({ isOpen, onClose, currentTab, onTabChange }: AppSidebarProps) {
  const handleSelect = (tab: AppTab) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 h-full w-64 z-50 bg-sidebar text-sidebar-foreground shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
              <span className="font-bold text-base text-sidebar-foreground">Menu</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
                aria-label="Close menu"
              >
                <X size={20} className="text-sidebar-foreground" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => {
                const active = currentTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    {label}
                  </button>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
