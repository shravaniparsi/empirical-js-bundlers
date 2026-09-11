import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import CommentsCard from './CommentsCard';
import CommentsContainer2 from './CommentsContainer2';
import CommentsAccordion from './CommentsAccordion';
import SchedulingToast from '../scheduling/SchedulingToast';
import BillingRangeSlider1 from '../billing/BillingRangeSlider1';
import ApiKeysColorPicker1 from '../api-keys/ApiKeysColorPicker1';
import styles from './CommentsFooter.module.css';

type LayoutDirection = 'horizontal' | 'vertical';
type LayoutGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CommentsFooterProps {
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

export default function CommentsFooter({
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

}: CommentsFooterProps) {
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
      <CommentsCard />
      <CommentsContainer2 />
      <CommentsAccordion />
      <SchedulingToast />
      <BillingRangeSlider1 />
      <ApiKeysColorPicker1 />
        </div>
      )}
    </Component>
  );
}
