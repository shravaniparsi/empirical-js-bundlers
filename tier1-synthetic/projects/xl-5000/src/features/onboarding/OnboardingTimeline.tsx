import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
import OnboardingToggle1 from './OnboardingToggle1';
import OnboardingPopover3 from './OnboardingPopover3';
import KnowledgeBaseSummary2 from '../knowledge-base/KnowledgeBaseSummary2';
import styles from './OnboardingTimeline.module.css';

interface OnboardingTimelineItem {
  title: string;
  assignee: string;
  updatedAt: Date;
  id: string;
}

interface OnboardingTimelineProps {
  items?: OnboardingTimelineItem[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function OnboardingTimeline({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: OnboardingTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'title' | 'assignee'>('title');

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
            className={clsx(styles.sortBtn, sortField === 'title' && styles.active)}
            onClick={() => handleSort('title')}
          >
            By title
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, ['title', 'assignee', 'updatedAt']);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.title}</span>
                <span className={styles.meta}>{picked.assignee}</span>
              </div>

            </li>
          );
        })}
      </ul>

      <div className={styles.children}>
      <OnboardingToggle1 />
      <OnboardingPopover3 />
      <KnowledgeBaseSummary2 />
      </div>
    </div>
  );
}
