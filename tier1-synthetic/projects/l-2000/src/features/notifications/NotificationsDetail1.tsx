import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import NotificationsGauge1 from './NotificationsGauge1';
import NotificationsTreeView from './NotificationsTreeView';
import styles from './NotificationsDetail1.module.css';

interface NotificationsDetail1Item {
  createdAt: Date;
  title: string;
  tags: string[];
  priority: number;
  updatedAt: Date;
  description: string;
  id: string;
}

interface NotificationsDetail1Props {
  items?: NotificationsDetail1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function NotificationsDetail1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: NotificationsDetail1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'title'>('createdAt');

  const visibleItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const aVal = String(a[sortField] ?? '');
      const bVal = String(b[sortField] ?? '');
      return aVal.localeCompare(bVal);
    });
    return sorted.slice(0, maxItems);
  }, [items, sortField, maxItems]);

  const summary = useMemo(
    () => ({ total: items.length, visible: visibleItems.length }),
    [items.length, visibleItems.length]
  );

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
    onItemClick?.(id);
  };

  const handleSort = (field: typeof sortField) => {
    setSortField(field);
  };

  return (
    <div className={clsx(styles.container, styles[variant], className)}>
      <div className={styles.header}>
        <span className={styles.count}>
          Showing {summary.visible} of {summary.total}
        </span>
        <div className={styles.sortControls}>
          <button
            className={clsx(styles.sortBtn, sortField === 'createdAt' && styles.active)}
            onClick={() => handleSort('createdAt')}
          >
            By createdAt
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['createdAt', 'title', 'tags']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.createdAt}</span>
                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <NotificationsGauge1 />
      <NotificationsTreeView />
      </div>
    </div>
  );
}
