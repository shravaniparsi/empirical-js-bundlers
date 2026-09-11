import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import WorkflowsInput from './WorkflowsInput';
import styles from './WorkflowsTimeline2.module.css';

interface WorkflowsTimeline2Item {
  description: string;
  updatedAt: Date;
  priority: number;
  status: string;
  id: string;
}

interface WorkflowsTimeline2Props {
  items?: WorkflowsTimeline2Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function WorkflowsTimeline2({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: WorkflowsTimeline2Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'description' | 'updatedAt'>('description');

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
            className={clsx(styles.sortBtn, sortField === 'description' && styles.active)}
            onClick={() => handleSort('description')}
          >
            By description
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['description', 'updatedAt', 'priority']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.description}</span>
                <span className={styles.meta}>{picked.updatedAt}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <WorkflowsInput />
      </div>
    </div>
  );
}
