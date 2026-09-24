import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import CampaignsTabs from './CampaignsTabs';
import styles from './CampaignsBottomNav.module.css';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  disabled?: boolean;
  badge?: number;
  children?: NavItem[];
}

interface CampaignsBottomNavProps {
  items: NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pills' | 'underline' | 'bordered';
  className?: string;
}

export default function CampaignsBottomNav({
  items,
  activeId,
  onSelect,
  orientation = 'horizontal',
  size = 'md',
  variant = 'underline',
  className,
}: CampaignsBottomNavProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleSelect = useCallback(
    (item: NavItem) => {
      if (item.disabled) return;
      if (item.children?.length) {
        setExpandedIds(prev => {
          const next = new Set(prev);
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        });
      } else {
        onSelect?.(item.id);
      }
    },
    [onSelect]
  );

  const activeItem = useMemo(
    () => items.find(item => item.id === activeId),
    [items, activeId]
  );

  const navClasses = clsx(
    styles.nav,
    styles[orientation],
    styles[`size-${size}`],
    styles[variant],
    className
  );

  const renderItem = (item: NavItem, depth = 0) => {
    const isActive = item.id === activeId;
    const isHovered = item.id === hoveredId;
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = (item.children?.length ?? 0) > 0;

    return (
      <li key={item.id} className={styles.itemWrapper}>
        <button
          className={clsx(
            styles.item,
            isActive && styles.active,
            isHovered && styles.hovered,
            item.disabled && styles.disabled,
            depth > 0 && styles.nested
          )}
          onClick={() => handleSelect(item)}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
          aria-current={isActive ? 'page' : undefined}
          disabled={item.disabled}
          style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
        >
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span className={styles.label}>{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className={styles.badge}>{item.badge > 99 ? '99+' : item.badge}</span>
          )}
          {hasChildren && (
            <span className={clsx(styles.chevron, isExpanded && styles.rotated)}>▾</span>
          )}
        </button>
        {hasChildren && isExpanded && (
          <ul className={styles.subList}>
            {item.children!.map(child => renderItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className={navClasses} aria-label="CampaignsBottomNav">
      {activeItem && (
        <div className={styles.activeIndicator}>
          Current: {activeItem.label}
        </div>
      )}
      <ul className={styles.list}>
        {items.map(item => renderItem(item))}
      </ul>
      <div className={styles.extra}>
      <CampaignsTabs />
      </div>
    </nav>
  );
}
