import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import FeedbackMgmtGrid1 from './FeedbackMgmtGrid1';
import FeedbackMgmtCollapse from './FeedbackMgmtCollapse';
import FeedbackMgmtAvatar from './FeedbackMgmtAvatar';
import ImportsScore1 from '../imports/ImportsScore1';
import ReportsMeter1 from '../reports/ReportsMeter1';
import styles from './FeedbackMgmtAvatar1.module.css';

interface FeedbackMgmtAvatar1Item {
  description: string;
  tags: string[];
  title: string;
  id: string;
}

interface FeedbackMgmtAvatar1Props {
  items?: FeedbackMgmtAvatar1Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function FeedbackMgmtAvatar1({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: FeedbackMgmtAvatar1Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'description' | 'tags'>('description');

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
          const picked = pick(item, ['description', 'tags', 'title']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.description}</span>
                <span className={styles.meta}>{picked.tags}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <FeedbackMgmtGrid1 />
      <FeedbackMgmtCollapse />
      <FeedbackMgmtAvatar />
      <ImportsScore1 />
      <ReportsMeter1 />
      </div>
    </div>
  );
}
