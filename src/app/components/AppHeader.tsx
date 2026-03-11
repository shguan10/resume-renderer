import React from 'react';
import { AlignLeft } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  subtitle?: string | undefined;
  onFeedback: () => void;
  onMenuOpen: () => void;
}

/**
 * Shared app header: hamburger menu on the left, title/subtitle in the
 * centre, and a Feedback button on the right.
 * The back-navigation arrow has been removed — back navigation is handled
 * by individual views as needed.
 */
export function AppHeader({ title, subtitle, onFeedback, onMenuOpen }: AppHeaderProps) {
  return (
    <header className="app-header">
      {/* Left: hamburger */}
      <button
        data-tour="menu-button"
        onClick={onMenuOpen}
        className="app-header-menu-btn shrink-0"
        aria-label="Open menu"
      >
        <AlignLeft size={20} />
      </button>

      {/* Centre: title + subtitle */}
      <div className="flex-1 min-w-0 px-3">
        <h1 className="app-header-title truncate">{title}</h1>
        {subtitle && <p className="app-header-subtitle truncate">{subtitle}</p>}
      </div>
    </header>
  );
}

