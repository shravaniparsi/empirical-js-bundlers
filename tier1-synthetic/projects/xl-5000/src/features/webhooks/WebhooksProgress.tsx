import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import WebhooksBreadcrumb1 from './WebhooksBreadcrumb1';
import WebhooksSearch from './WebhooksSearch';
import WebhooksLoader1 from './WebhooksLoader1';
import CommentsResponsive1 from '../comments/CommentsResponsive1';
import styles from './WebhooksProgress.module.css';

interface WebhooksProgressItem {
  assignee: string;
  updatedAt: Date;
  priority: number;
  status: string;
  id: string;
}

interface WebhooksProgressProps {
  items?: WebhooksProgressItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function WebhooksProgress({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: WebhooksProgressProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'assignee' | 'updatedAt'>('assignee');

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
          const picked = pick(item, ['assignee', 'updatedAt', 'priority']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.assignee}</span>
                <span className={styles.meta}>{picked.updatedAt}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <WebhooksBreadcrumb1 />
      <WebhooksSearch />
      <WebhooksLoader1 />
      <CommentsResponsive1 />
      </div>
    </div>
  );
}
