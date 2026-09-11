import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import SchedulingThumbnail1 from './SchedulingThumbnail1';
import DocumentsContext from '../documents/DocumentsContext';
import styles from './SchedulingSummary2.module.css';

interface SchedulingSummary2Item {
  tags: string[];
  status: string;
  priority: number;
  title: string;
  assignee: string;
  description: string;
  id: string;
}

interface SchedulingSummary2Props {
  items?: SchedulingSummary2Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function SchedulingSummary2({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: SchedulingSummary2Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'tags' | 'status'>('tags');

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
            className={clsx(styles.sortBtn, sortField === 'tags' && styles.active)}
            onClick={() => handleSort('tags')}
          >
            By tags
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['tags', 'status', 'priority']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.tags}</span>
                <span className={styles.meta}>{picked.status}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <SchedulingThumbnail1 />
      <DocumentsContext />
      </div>
    </div>
  );
}
