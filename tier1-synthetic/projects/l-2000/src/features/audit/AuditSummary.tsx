import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import AuditHeatmap from './AuditHeatmap';
import AuditHeatmap2 from './AuditHeatmap2';
import AuditErrorBoundary from './AuditErrorBoundary';
import ProfileLoader1 from '../profile/ProfileLoader1';
import styles from './AuditSummary.module.css';

interface AuditSummaryItem {
  assignee: string;
  status: string;
  description: string;
  title: string;
  updatedAt: Date;
  id: string;
}

interface AuditSummaryProps {
  items?: AuditSummaryItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function AuditSummary({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: AuditSummaryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'assignee' | 'status'>('assignee');

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
          const picked = pick(item, ['assignee', 'status', 'description']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.assignee}</span>
                <span className={styles.meta}>{picked.status}</span>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Status</span>
                    <span className={styles.fieldValue}>{String(item.status)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Description</span>
                    <span className={styles.fieldValue}>{String(item.description)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Title</span>
                    <span className={styles.fieldValue}>{String(item.title)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>UpdatedAt</span>
                    <span className={styles.fieldValue}>{format(item.updatedAt, 'PPpp')}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <AuditHeatmap />
      <AuditHeatmap2 />
      <AuditErrorBoundary />
      <ProfileLoader1 />
      </div>
    </div>
  );
}
