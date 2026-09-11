import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import ProfileChip from './ProfileChip';
import CommentsResponsive1 from '../comments/CommentsResponsive1';
import styles from './ProfileFeed.module.css';

interface ProfileFeedItem {
  updatedAt: Date;
  status: string;
  title: string;
  description: string;
  id: string;
}

interface ProfileFeedProps {
  items?: ProfileFeedItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function ProfileFeed({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: ProfileFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'updatedAt' | 'status'>('updatedAt');

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
            className={clsx(styles.sortBtn, sortField === 'updatedAt' && styles.active)}
            onClick={() => handleSort('updatedAt')}
          >
            By updatedAt
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['updatedAt', 'status', 'title']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.updatedAt}</span>
                <span className={styles.meta}>{picked.status}</span>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Status</span>
                    <span className={styles.fieldValue}>{String(item.status)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Title</span>
                    <span className={styles.fieldValue}>{String(item.title)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Description</span>
                    <span className={styles.fieldValue}>{String(item.description)}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <ProfileChip />
      <CommentsResponsive1 />
      </div>
    </div>
  );
}
