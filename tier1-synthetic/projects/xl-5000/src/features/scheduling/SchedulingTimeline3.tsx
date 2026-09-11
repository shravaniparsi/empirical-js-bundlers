import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import SchedulingBottomNav from './SchedulingBottomNav';
import SchedulingInput from './SchedulingInput';
import SchedulingTreeView from './SchedulingTreeView';
import BillingCheckbox3 from '../billing/BillingCheckbox3';
import styles from './SchedulingTimeline3.module.css';

interface SchedulingTimeline3Item {
  priority: number;
  description: string;
  assignee: string;
  updatedAt: Date;
  title: string;
  id: string;
}

interface SchedulingTimeline3Props {
  items?: SchedulingTimeline3Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function SchedulingTimeline3({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: SchedulingTimeline3Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'priority' | 'description'>('priority');

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
          const picked = pick(item, ['priority', 'description', 'assignee']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.priority}</span>
                <span className={styles.meta}>{picked.description}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <SchedulingBottomNav />
      <SchedulingInput />
      <SchedulingTreeView />
      <BillingCheckbox3 />
      </div>
    </div>
  );
}
