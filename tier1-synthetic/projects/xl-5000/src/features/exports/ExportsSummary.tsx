import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import ExportsSnackbar1 from './ExportsSnackbar1';
import ExportsChip from './ExportsChip';
import ExportsBottomNav from './ExportsBottomNav';
import TeamsSummary1 from '../teams/TeamsSummary1';
import styles from './ExportsSummary.module.css';

interface ExportsSummaryItem {
  priority: number;
  createdAt: Date;
  tags: string[];
  id: string;
}

interface ExportsSummaryProps {
  items?: ExportsSummaryItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function ExportsSummary({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: ExportsSummaryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'priority' | 'createdAt'>('priority');

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
          const picked = pick(item, ['priority', 'createdAt', 'tags']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.priority}</span>
                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <ExportsSnackbar1 />
      <ExportsChip />
      <ExportsBottomNav />
      <TeamsSummary1 />
      </div>
    </div>
  );
}
