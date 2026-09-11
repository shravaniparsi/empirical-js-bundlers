import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import NotificationsAvatar from './NotificationsAvatar';
import NotificationsTreeView from './NotificationsTreeView';
import NotificationsDrawer from './NotificationsDrawer';
import styles from './NotificationsGrid2.module.css';

interface NotificationsGrid2Item {
  priority: number;
  updatedAt: Date;
  assignee: string;
  status: string;
  id: string;
}

interface NotificationsGrid2Props {
  items?: NotificationsGrid2Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function NotificationsGrid2({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: NotificationsGrid2Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'priority' | 'updatedAt'>('priority');

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
            className={clsx(styles.sortBtn, sortField === 'priority' && styles.active)}
            onClick={() => handleSort('priority')}
          >
            By priority
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['priority', 'updatedAt', 'assignee']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.priority}</span>
                <span className={styles.meta}>{picked.updatedAt}</span>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>UpdatedAt</span>
                    <span className={styles.fieldValue}>{format(item.updatedAt, 'PPpp')}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Assignee</span>
                    <span className={styles.fieldValue}>{String(item.assignee)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Status</span>
                    <span className={styles.fieldValue}>{String(item.status)}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <NotificationsAvatar />
      <NotificationsTreeView />
      <NotificationsDrawer />
      </div>
    </div>
  );
}
