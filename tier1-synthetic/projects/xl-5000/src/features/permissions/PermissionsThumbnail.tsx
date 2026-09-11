import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import PermissionsRegistry from './PermissionsRegistry';
import PermissionsDrawer from './PermissionsDrawer';
import PermissionsFeed from './PermissionsFeed';
import styles from './PermissionsThumbnail.module.css';

interface PermissionsThumbnailItem {
  assignee: string;
  priority: number;
  createdAt: Date;
  description: string;
  updatedAt: Date;
  tags: string[];
  id: string;
}

interface PermissionsThumbnailProps {
  items?: PermissionsThumbnailItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function PermissionsThumbnail({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: PermissionsThumbnailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'assignee' | 'priority'>('assignee');

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
            className={clsx(styles.sortBtn, sortField === 'assignee' && styles.active)}
            onClick={() => handleSort('assignee')}
          >
            By assignee
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['assignee', 'priority', 'createdAt']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.assignee}</span>
                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Priority</span>
                    <span className={styles.fieldValue}>{String(item.priority)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>CreatedAt</span>
                    <span className={styles.fieldValue}>{format(item.createdAt, 'PPpp')}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Description</span>
                    <span className={styles.fieldValue}>{String(item.description)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>UpdatedAt</span>
                    <span className={styles.fieldValue}>{format(item.updatedAt, 'PPpp')}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Tags</span>
                    <span className={styles.fieldValue}>{item.tags?.join(", ")}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <PermissionsRegistry />
      <PermissionsDrawer />
      <PermissionsFeed />
      </div>
    </div>
  );
}
