import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import OnboardingLoader from './OnboardingLoader';
import OnboardingTimeline1 from './OnboardingTimeline1';
import UsersDonut2 from '../users/UsersDonut2';
import KnowledgeBaseFunnel1 from '../knowledge-base/KnowledgeBaseFunnel1';
import styles from './OnboardingResponsive.module.css';

type LayoutDirection = 'horizontal' | 'vertical';
type LayoutGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface OnboardingResponsiveProps {
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

}

export default function OnboardingResponsive({
  children,
  direction = 'horizontal',
  gap = 'md',
  padding = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  fullWidth = false,
  className,
  as: Component = 'div',

}: OnboardingResponsiveProps) {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

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
    <Component className={containerClasses}>
      {isVisible && (
        <div className={styles.content}>
          {children}
      <OnboardingLoader />
      <OnboardingTimeline1 />
      <UsersDonut2 />
      <KnowledgeBaseFunnel1 />
        </div>
      )}
    </Component>
  );
}
