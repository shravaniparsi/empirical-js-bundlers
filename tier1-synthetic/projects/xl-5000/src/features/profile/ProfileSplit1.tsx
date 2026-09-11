import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import ProfileFeed1 from './ProfileFeed1';
import ProfileMeter2 from './ProfileMeter2';
import styles from './ProfileSplit1.module.css';

type LayoutDirection = 'horizontal' | 'vertical';
type LayoutGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface ProfileSplit1Props {
  children?: React.ReactNode;
  direction?: LayoutDirection;
  gap?: LayoutGap;
  padding?: LayoutGap;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  fullWidth?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'aside' | 'article';
  sidebarWidth?: string;
  collapsible?: boolean;
}

export default function ProfileSplit1({
  children,
  direction = 'horizontal',
  gap = 'md',
  padding = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  fullWidth = false,
  className,
  as: Component = 'aside',
  sidebarWidth = '280px',
  collapsible = true,
}: ProfileSplit1Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const sidebarStyle = useMemo(() => ({
    width: isCollapsed ? '60px' : sidebarWidth,
    transition: 'width 0.2s ease',
  }), [isCollapsed, sidebarWidth]);

  const containerClasses = useMemo(
    () =>
      clsx(
        styles.container,
        styles[`dir-${direction}`],
        styles[`gap-${gap}`],
        styles[`pad-${padding}`],
        styles[`align-${align}`],
        styles[`justify-${justify}`],
        wrap && styles.wrap,
        fullWidth && styles.fullWidth,
        className
      ),
    [direction, gap, padding, align, justify, wrap, fullWidth, className]
  );

  return (
    <Component className={containerClasses} style={sidebarStyle}>
      {collapsible && (
        <button className={styles.collapseBtn} onClick={toggleCollapse}>
          {isCollapsed ? '→' : '←'}
        </button>
      )}
      {!isCollapsed && (
        <div className={styles.content}>
          {children}
      <ProfileFeed1 />
      <ProfileMeter2 />
        </div>
      )}
    </Component>
  );
}
