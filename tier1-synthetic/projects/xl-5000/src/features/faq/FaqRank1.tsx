import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import FaqRank from './FaqRank';
import FaqColorPicker from './FaqColorPicker';
import FaqAreaChart from './FaqAreaChart';
import styles from './FaqRank1.module.css';

interface FaqRank1Item {
  assignee: string;
  title: string;
  priority: number;
  id: string;
}

interface FaqRank1Props {
  items?: FaqRank1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function FaqRank1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: FaqRank1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'assignee' | 'title'>('assignee');

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
          const picked = pick(item, ['assignee', 'title', 'priority']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.assignee}</span>
                <span className={styles.meta}>{picked.title}</span>
              </div>
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Title</span>
                    <span className={styles.fieldValue}>{String(item.title)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Priority</span>
                    <span className={styles.fieldValue}>{String(item.priority)}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <FaqRank />
      <FaqColorPicker />
      <FaqAreaChart />
      </div>
    </div>
  );
}
