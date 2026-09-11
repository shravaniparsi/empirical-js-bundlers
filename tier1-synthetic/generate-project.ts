/**
 * generate-project.ts — Deterministic Calibrated Synthetic React Project Generator
 *
 * Part of: "An Empirical Evaluation of Rust-Based JavaScript Bundlers"
 *
 * Generates React+TypeScript projects with realistic component patterns
 * across 8 template categories. Uses seeded PRNG for full determinism.
 *
 * Usage:
 *   npx tsx generate-project.ts --size 500 --seed 42 --output ./projects/m-500
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Seeded PRNG (Mulberry32) — deterministic random for reproducibility
// ─────────────────────────────────────────────────────────────────────────────

function createPRNG(seed: number) {
  let state = seed | 0;
  function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    random: next,
    int(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(next() * arr.length)];
    },
    shuffle<T>(arr: T[]): T[] {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
    weightedPick<T>(items: T[], weights: number[]): T {
      const total = weights.reduce((s, w) => s + w, 0);
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

interface Config {
  size: number;
  seed: number;
  outputDir: string;
}

function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Partial<Config> = {};
  for (let i = 0; i < args.length; i += 2) {
    switch (args[i]) {
      case '--size': config.size = parseInt(args[i + 1], 10); break;
      case '--seed': config.seed = parseInt(args[i + 1], 10); break;
      case '--output': config.outputDir = args[i + 1]; break;
    }
  }
  if (!config.size || !config.seed || !config.outputDir) {
    console.error('Usage: tsx generate-project.ts --size <N> --seed <S> --output <dir>');
    process.exit(1);
  }
  return config as Config;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Constants & Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'data-display', 'form-control', 'layout', 'navigation',
  'feedback', 'data-fetching', 'chart-viz', 'utility',
] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_WEIGHTS = [25, 15, 15, 10, 10, 10, 10, 5];

const FEATURE_FOLDER_NAMES = [
  'auth', 'dashboard', 'products', 'orders', 'users', 'settings',
  'notifications', 'analytics', 'reports', 'billing', 'inventory',
  'shipping', 'payments', 'reviews', 'search', 'catalog', 'cart',
  'checkout', 'profile', 'admin', 'audit', 'tags', 'categories',
  'media', 'documents', 'workflows', 'integrations', 'webhooks',
  'api-keys', 'themes', 'localization', 'permissions', 'roles',
  'teams', 'projects', 'tasks', 'comments', 'activity', 'exports',
  'imports', 'scheduling', 'campaigns', 'templates', 'forms',
  'surveys', 'feedback-mgmt', 'support', 'knowledge-base', 'faq',
  'onboarding', 'subscriptions',
];

const DATA_DISPLAY_NAMES = [
  'Card', 'List', 'Table', 'Grid', 'Detail', 'Summary', 'Badge',
  'Avatar', 'Stat', 'Timeline', 'Feed', 'Thumbnail', 'Preview',
  'Chip', 'Tag', 'Label', 'Progress', 'Meter', 'Rank', 'Score',
];
const FORM_NAMES = [
  'Input', 'Select', 'Checkbox', 'Radio', 'Toggle', 'Slider',
  'DatePicker', 'TimePicker', 'FileUpload', 'TextArea', 'Search',
  'Autocomplete', 'ColorPicker', 'RangeSlider', 'Rating',
];
const LAYOUT_NAMES = [
  'Container', 'Sidebar', 'Header', 'Footer', 'Grid', 'Stack',
  'Divider', 'Spacer', 'Panel', 'Accordion', 'Collapse', 'Split',
  'Scroll', 'Sticky', 'Responsive',
];
const NAV_NAMES = [
  'Tabs', 'Breadcrumb', 'Menu', 'Pagination', 'Stepper',
  'NavBar', 'Drawer', 'Link', 'BottomNav', 'TreeView',
];
const FEEDBACK_NAMES = [
  'Modal', 'Toast', 'Alert', 'Confirm', 'Tooltip', 'Popover',
  'Snackbar', 'Banner', 'Notification', 'Spinner', 'Skeleton',
];
const FETCH_NAMES = [
  'Loader', 'ErrorBoundary', 'Suspense', 'Retry', 'Placeholder',
  'InfiniteScroll', 'Paginated', 'Polling', 'Cached', 'Prefetch',
];
const CHART_NAMES = [
  'BarChart', 'LineChart', 'PieChart', 'AreaChart', 'Donut',
  'Sparkline', 'Heatmap', 'Scatter', 'Funnel', 'Gauge',
];
const UTILITY_NAMES = [
  'Provider', 'Context', 'HOC', 'Hook', 'Wrapper',
  'Composer', 'Bridge', 'Adapter', 'Factory', 'Registry',
];

const NAME_POOLS: Record<Category, string[]> = {
  'data-display': DATA_DISPLAY_NAMES,
  'form-control': FORM_NAMES,
  'layout': LAYOUT_NAMES,
  'navigation': NAV_NAMES,
  'feedback': FEEDBACK_NAMES,
  'data-fetching': FETCH_NAMES,
  'chart-viz': CHART_NAMES,
  'utility': UTILITY_NAMES,
};

interface ComponentPlan {
  id: number;
  name: string;
  category: Category;
  featureFolder: string;
  filePath: string;
  cssPath: string;
  imports: number[];
  isDeadModule: boolean;
  isRouteEntry: boolean;
}

// Size-tier configurations
function getSizeConfig(size: number) {
  if (size <= 50) return { featureFolders: 5, routes: 0, tier: 'xs' as const };
  if (size <= 200) return { featureFolders: 10, routes: 4, tier: 's' as const };
  if (size <= 500) return { featureFolders: 15, routes: 12, tier: 'm' as const };
  if (size <= 2000) return { featureFolders: 30, routes: 20, tier: 'l' as const };
  return { featureFolders: 50, routes: 50, tier: 'xl' as const };
}

function getDeps(tier: string) {
  const base: Record<string, string> = {
    'react': '^19.0.0',
    'react-dom': '^19.0.0',
    'lodash-es': '^4.17.21',
    'date-fns': '^4.1.0',
    'clsx': '^2.1.1',
  };
  const devBase: Record<string, string> = {
    '@types/react': '^19.0.0',
    '@types/react-dom': '^19.0.0',
    '@types/lodash-es': '^4.17.12',
    'typescript': '^5.6.0',
  };
  if (tier !== 'xs') {
    base['react-router-dom'] = '^7.1.0';
  }
  if (tier === 'm' || tier === 'l' || tier === 'xl') {
    base['zustand'] = '^5.0.0';
    base['recharts'] = '^2.15.0';
    base['react-hook-form'] = '^7.54.0';
    base['zod'] = '^3.24.0';
  }
  if (tier === 'l' || tier === 'xl') {
    base['@tanstack/react-query'] = '^5.62.0';
    base['immer'] = '^10.1.0';
  }
  return { dependencies: base, devDependencies: devBase };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Component Planner
// ─────────────────────────────────────────────────────────────────────────────

function planComponents(config: Config, rng: ReturnType<typeof createPRNG>): ComponentPlan[] {
  const sizeConfig = getSizeConfig(config.size);
  const folders = FEATURE_FOLDER_NAMES.slice(0, sizeConfig.featureFolders);
  const componentsPerFolder = Math.ceil(config.size / folders.length);
  const components: ComponentPlan[] = [];
  const usedNames = new Set<string>();

  let id = 0;
  for (const folder of folders) {
    const count = Math.min(componentsPerFolder, config.size - components.length);
    if (count <= 0) break;

    for (let i = 0; i < count; i++) {
      const category = rng.weightedPick([...CATEGORIES], [...CATEGORY_WEIGHTS]);
      const pool = NAME_POOLS[category];
      const baseName = rng.pick(pool);
      let name = `${capitalize(folder)}${baseName}`;
      let suffix = 1;
      while (usedNames.has(name)) {
        name = `${capitalize(folder)}${baseName}${suffix++}`;
      }
      usedNames.add(name);

      components.push({
        id: id++,
        name,
        category,
        featureFolder: folder,
        filePath: `src/features/${folder}/${name}.tsx`,
        cssPath: `src/features/${folder}/${name}.module.css`,
        imports: [],
        isDeadModule: false,
        isRouteEntry: false,
      });
    }
  }

  // Mark 5% as dead modules (imported by nothing — tree-shaking test)
  const deadCount = Math.max(1, Math.floor(components.length * 0.05));
  const shuffled = rng.shuffle(components.map((_, i) => i));
  for (let i = 0; i < deadCount; i++) {
    components[shuffled[i]].isDeadModule = true;
  }

  // Mark route entry components (one per route from distinct feature folders)
  if (sizeConfig.routes > 0) {
    const routeFolders = rng.shuffle([...folders]).slice(0, sizeConfig.routes);
    for (const folder of routeFolders) {
      const folderComponents = components.filter(
        c => c.featureFolder === folder && !c.isDeadModule
      );
      if (folderComponents.length > 0) {
        folderComponents[0].isRouteEntry = true;
      }
    }
  }

  return components;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Dependency Graph Generator
// ─────────────────────────────────────────────────────────────────────────────

function buildDependencyGraph(
  components: ComponentPlan[],
  rng: ReturnType<typeof createPRNG>
): void {
  const byFolder = new Map<string, ComponentPlan[]>();
  for (const c of components) {
    const list = byFolder.get(c.featureFolder) || [];
    list.push(c);
    byFolder.set(c.featureFolder, list);
  }
  const allFolders = [...byFolder.keys()];

  for (const comp of components) {
    if (comp.isDeadModule) continue;

    const siblings = (byFolder.get(comp.featureFolder) || []).filter(
      c => c.id !== comp.id && !c.isDeadModule
    );

    // Each component imports 1-3 siblings (same feature folder)
    const siblingCount = Math.min(rng.int(1, 3), siblings.length);
    const pickedSiblings = rng.shuffle(siblings).slice(0, siblingCount);
    for (const s of pickedSiblings) {
      if (!comp.imports.includes(s.id)) {
        comp.imports.push(s.id);
      }
    }

    // 10% chance of cross-feature import
    if (rng.random() < 0.10 && allFolders.length > 1) {
      const otherFolders = allFolders.filter(f => f !== comp.featureFolder);
      const targetFolder = rng.pick(otherFolders);
      const targets = (byFolder.get(targetFolder) || []).filter(c => !c.isDeadModule);
      if (targets.length > 0) {
        const target = rng.pick(targets);
        if (!comp.imports.includes(target.id)) {
          comp.imports.push(target.id);
        }
      }
    }
  }

  // Create hub components (imported by 20+ parents) — pick top ~2%
  const hubCount = Math.max(1, Math.floor(components.length * 0.02));
  const nonDead = components.filter(c => !c.isDeadModule);
  const hubs = rng.shuffle(nonDead).slice(0, hubCount);
  for (const hub of hubs) {
    const potentialParents = nonDead.filter(
      c => c.id !== hub.id && !c.imports.includes(hub.id)
    );
    const parentCount = Math.min(rng.int(20, 30), potentialParents.length);
    const parents = rng.shuffle(potentialParents).slice(0, parentCount);
    for (const p of parents) {
      p.imports.push(hub.id);
    }
  }

  // Detect and break circular imports
  breakCircularImports(components);
}

function breakCircularImports(components: ComponentPlan[]): void {
  const visited = new Set<number>();
  const stack = new Set<number>();

  function dfs(id: number): boolean {
    if (stack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    stack.add(id);
    const comp = components[id];
    comp.imports = comp.imports.filter(depId => {
      const hasCycle = dfs(depId);
      return !hasCycle;
    });
    stack.delete(id);
    return false;
  }

  for (const comp of components) {
    visited.clear();
    stack.clear();
    dfs(comp.id);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6. Component Template Generators (8 categories, 50-150 LOC each)
// ─────────────────────────────────────────────────────────────────────────────

function getRelativeImport(from: string, to: string): string {
  const fromDir = path.dirname(from);
  const toFile = to.replace(/\.tsx$/, '');
  let rel = path.relative(fromDir, toFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function generateComponent(
  comp: ComponentPlan,
  allComponents: ComponentPlan[],
  tier: string,
  rng: ReturnType<typeof createPRNG>
): { tsx: string; css: string } {
  const importedComps = comp.imports.map(id => allComponents[id]);
  const cssModuleName = comp.name.replace(/[^a-zA-Z]/g, '');

  switch (comp.category) {
    case 'data-display': return genDataDisplay(comp, importedComps, cssModuleName, tier, rng);
    case 'form-control': return genFormControl(comp, importedComps, cssModuleName, tier, rng);
    case 'layout': return genLayout(comp, importedComps, cssModuleName, tier, rng);
    case 'navigation': return genNavigation(comp, importedComps, cssModuleName, tier, rng);
    case 'feedback': return genFeedback(comp, importedComps, cssModuleName, tier, rng);
    case 'data-fetching': return genDataFetching(comp, importedComps, cssModuleName, tier, rng);
    case 'chart-viz': return genChartViz(comp, importedComps, cssModuleName, tier, rng);
    case 'utility': return genUtility(comp, importedComps, cssModuleName, tier, rng);
    default: return genDataDisplay(comp, importedComps, cssModuleName, tier, rng);
  }
}

function buildChildImports(comp: ComponentPlan, children: ComponentPlan[]): string {
  return children
    .map(c => `import ${c.name} from '${getRelativeImport(comp.filePath, c.filePath)}';`)
    .join('\n');
}

function buildChildRender(children: ComponentPlan[]): string {
  return children.map(c => `      <${c.name} />`).join('\n');
}

// ── 6.1 Data Display (cards, lists, tables) ──

function genDataDisplay(
  comp: ComponentPlan, children: ComponentPlan[],
  cssName: string, tier: string, rng: ReturnType<typeof createPRNG>
): { tsx: string; css: string } {
  const fields = rng.shuffle(['title', 'description', 'status', 'createdAt', 'updatedAt', 'priority', 'assignee', 'tags'])
    .slice(0, rng.int(3, 6));

  const tsx = `import { useState, useMemo } from 'react';
import { pick } from 'lodash-es';
import { format } from 'date-fns';
import clsx from 'clsx';
${buildChildImports(comp, children)}
import styles from './${comp.name}.module.css';

interface ${comp.name}Item {
${fields.map(f => `  ${f}: ${f.includes('At') ? 'Date' : f === 'tags' ? 'string[]' : f === 'priority' ? 'number' : 'string'};`).join('\n')}
  id: string;
}

interface ${comp.name}Props {
  items?: ${comp.name}Item[];
  onItemClick?: (id: string) => void;
  variant?: 'compact' | 'detailed';
  className?: string;
  maxItems?: number;
}

export default function ${comp.name}({
  items = [],
  onItemClick,
  variant = 'detailed',
  className,
  maxItems = 10,
}: ${comp.name}Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'${fields[0]}' | '${fields[1] || fields[0]}'>('${fields[0]}');

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
            className={clsx(styles.sortBtn, sortField === '${fields[0]}' && styles.active)}
            onClick={() => handleSort('${fields[0]}')}
          >
            By ${fields[0]}
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {visibleItems.map(item => {
          const picked = pick(item, [${fields.slice(0, 3).map(f => `'${f}'`).join(', ')}]);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={clsx(styles.item, isExpanded && styles.expanded)}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{picked.${fields[0]}}</span>
${fields.includes('createdAt') ? `                <time className={styles.timestamp}>{format(item.createdAt, 'MMM dd, yyyy')}</time>` : `                <span className={styles.meta}>{picked.${fields[1] || fields[0]}}</span>`}
              </div>
${rng.random() > 0.5 ? `              {isExpanded && (
                <div className={styles.details}>
${fields.slice(1).map(f => `                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>${capitalize(f)}</span>
                    <span className={styles.fieldValue}>{${f === 'tags' ? 'item.tags?.join(", ")' : f.includes('At') ? `format(item.${f}, 'PPpp')` : `String(item.${f})`}}</span>
                  </div>`).join('\n')}
                </div>
              )}` : ''}
            </li>
          );
        })}
      </ul>

${children.length > 0 ? `      <div className={styles.children}>
${buildChildRender(children)}
      </div>` : ''}
    </div>
  );
}
`;

  const css = `.container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #ffffff;
}
.compact { padding: 0.5rem; }
.detailed { padding: 1.25rem; }
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}
.count { font-size: 0.875rem; color: #64748b; }
.sortControls { display: flex; gap: 0.5rem; }
.sortBtn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  background: #f8fafc;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s ease;
}
.sortBtn:hover { background: #e2e8f0; }
.active { background: #3b82f6; color: #ffffff; border-color: #3b82f6; }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.item {
  padding: 0.75rem;
  border-radius: 0.375rem;
  background: #f8fafc;
  cursor: pointer;
  transition: background 0.15s ease;
}
.item:hover { background: #f1f5f9; }
.expanded { background: #eff6ff; border: 1px solid #bfdbfe; }
.itemHeader { display: flex; justify-content: space-between; align-items: center; }
.itemTitle { font-weight: 600; color: #1e293b; }
.timestamp { font-size: 0.75rem; color: #94a3b8; }
.meta { font-size: 0.75rem; color: #64748b; }
.details { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.375rem; }
.field { display: flex; justify-content: space-between; font-size: 0.875rem; }
.fieldLabel { color: #64748b; font-weight: 500; }
.fieldValue { color: #1e293b; }
.children { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
`;

  return { tsx, css };
}

// ── 6.2 Form Control (inputs, selects, checkboxes) ──

function genFormControl(
  comp: ComponentPlan, children: ComponentPlan[],
  cssName: string, tier: string, rng: ReturnType<typeof createPRNG>
): { tsx: string; css: string } {
  const fieldType = rng.pick(['text', 'email', 'number', 'password', 'textarea', 'select']);
  const hasValidation = tier !== 'xs' && rng.random() > 0.4;

  const tsx = `import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash-es';
import clsx from 'clsx';
${hasValidation && (tier === 'm' || tier === 'l' || tier === 'xl') ? "import { z } from 'zod';" : ''}
${buildChildImports(comp, children)}
import styles from './${comp.name}.module.css';

${hasValidation && (tier === 'm' || tier === 'l' || tier === 'xl') ? `const ${comp.name}Schema = z.object({
  value: z.string().min(1, 'This field is required').max(255, 'Too long'),
});
` : ''}
interface ${comp.name}Props {
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
}

export default function ${comp.name}({
  label,
  name,
  value: controlledValue,
  defaultValue = '',
  placeholder,
  required = false,
  disabled = false,
  error: externalError,
  helperText,
  onChange,
  onBlur,
  className,
}: ${comp.name}Props) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTML${fieldType === 'textarea' ? 'TextArea' : fieldType === 'select' ? 'Select' : 'Input'}Element>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const displayError = externalError || (touched ? validationError : null);

  const debouncedValidate = useCallback(
    debounce((val: string) => {
${hasValidation && (tier === 'm' || tier === 'l' || tier === 'xl') ? `      const result = ${comp.name}Schema.safeParse({ value: val });
      setValidationError(result.success ? null : result.error.errors[0]?.message ?? 'Invalid');` : `      if (required && !val.trim()) {
        setValidationError('This field is required');
      } else {
        setValidationError(null);
      }`}
    }, 300),
    [required]
  );

  useEffect(() => {
    return () => {
      debouncedValidate.cancel();
    };
  }, [debouncedValidate]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTML${fieldType === 'textarea' ? 'TextArea' : fieldType === 'select' ? 'Select' : 'Input'}Element>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
      debouncedValidate(newValue);
    },
    [isControlled, onChange, debouncedValidate]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    onBlur?.();
  }, [onBlur]);

  const handleClear = useCallback(() => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
    inputRef.current?.focus();
  }, [isControlled, onChange]);

  const inputId = \`\${name}-field\`;

  return (
    <div className={clsx(styles.fieldWrapper, disabled && styles.disabled, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      <div className={clsx(styles.inputContainer, displayError && styles.hasError)}>
${fieldType === 'textarea' ? `        <textarea
          ref={inputRef}
          id={inputId}
          name={name}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          className={styles.input}
          rows={4}
        />` : fieldType === 'select' ? `        <select
          ref={inputRef}
          id={inputId}
          name={name}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          className={styles.input}
        >
          <option value="">{placeholder || 'Select...'}</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>` : `        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="${fieldType}"
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          className={styles.input}
        />`}

        {currentValue && !disabled && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Clear field"
          >
            ×
          </button>
        )}
      </div>

      {(displayError || helperText) && (
        <span className={clsx(styles.hint, displayError && styles.errorText)}>
          {displayError || helperText}
        </span>
      )}

${children.length > 0 ? `      <div className={styles.related}>
${buildChildRender(children)}
      </div>` : ''}
    </div>
  );
}
`;

  const css = `.fieldWrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
}
.disabled { opacity: 0.6; pointer-events: none; }
.label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
.required { color: #ef4444; margin-left: 0.125rem; }
.inputContainer {
  position: relative;
  display: flex;
  align-items: center;
}
.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  background: #ffffff;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.hasError .input { border-color: #ef4444; }
.hasError .input:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15); }
.clearBtn {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.125rem;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
}
.clearBtn:hover { color: #374151; }
.hint { font-size: 0.75rem; color: #6b7280; }
.errorText { color: #ef4444; }
.related { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
`;

  return { tsx, css };
}

// ── 6.3 Layout (containers, grids, sidebars) ──

function genLayout(
  comp: ComponentPlan, children: ComponentPlan[],
  cssName: string, tier: string, rng: ReturnType<typeof createPRNG>
): { tsx: string; css: string } {
  const layoutType = rng.pick(['flex-col', 'flex-row', 'grid', 'sidebar']);

  const tsx = `import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
${buildChildImports(comp, children)}
import styles from './${comp.name}.module.css';

type LayoutDirection = 'horizontal' | 'vertical';
type LayoutGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface ${comp.name}Props {
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
${layoutType === 'sidebar' ? "  sidebarWidth?: string;\n  collapsible?: boolean;" : ''}
}

export default function ${comp.name}({
  children,
  direction = '${layoutType === 'flex-row' || layoutType === 'sidebar' ? 'horizontal' : 'vertical'}',
  gap = 'md',
  padding = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  fullWidth = false,
  className,
  as: Component = '${layoutType === 'sidebar' ? 'aside' : 'div'}',
${layoutType === 'sidebar' ? "  sidebarWidth = '280px',\n  collapsible = true," : ''}
}: ${comp.name}Props) {
${layoutType === 'sidebar' ? `  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const sidebarStyle = useMemo(() => ({
    width: isCollapsed ? '60px' : sidebarWidth,
    transition: 'width 0.2s ease',
  }), [isCollapsed, sidebarWidth]);
` : `  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);
`}
  const containerClasses = useMemo(
    () =>
      clsx(
        styles.container,
        styles[\`dir-\${direction}\`],
        styles[\`gap-\${gap}\`],
        styles[\`pad-\${padding}\`],
        styles[\`align-\${align}\`],
        styles[\`justify-\${justify}\`],
        wrap && styles.wrap,
        fullWidth && styles.fullWidth,
        className
      ),
    [direction, gap, padding, align, justify, wrap, fullWidth, className]
  );

  return (
    <Component className={containerClasses}${layoutType === 'sidebar' ? ' style={sidebarStyle}' : ''}>
${layoutType === 'sidebar' ? `      {collapsible && (
        <button className={styles.collapseBtn} onClick={toggleCollapse}>
          {isCollapsed ? '→' : '←'}
        </button>
      )}
      {!isCollapsed && (
        <div className={styles.content}>
          {children}
${children.length > 0 ? buildChildRender(children) : ''}
        </div>
      )}` : `      {isVisible && (
        <div className={styles.content}>
          {children}
${children.length > 0 ? buildChildRender(children) : ''}
        </div>
      )}`}
    </Component>
  );
}
`;

  const css = `.container { display: flex; box-sizing: border-box; }
.dir-horizontal { flex-direction: row; }
.dir-vertical { flex-direction: column; }
.gap-none { gap: 0; }
.gap-sm { gap: 0.25rem; }
.gap-md { gap: 0.75rem; }
.gap-lg { gap: 1.5rem; }
.gap-xl { gap: 2.5rem; }
.pad-none { padding: 0; }
.pad-sm { padding: 0.5rem; }
.pad-md { padding: 1rem; }
.pad-lg { padding: 1.5rem; }
.pad-xl { padding: 2rem; }
.align-start { align-items: flex-start; }
.align-center { align-items: center; }
.align-end { align-items: flex-end; }
.align-stretch { align-items: stretch; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.wrap { flex-wrap: wrap; }
.fullWidth { width: 100%; }
.content { flex: 1; min-width: 0; }
.collapseBtn {
  align-self: flex-start;
  padding: 0.375rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  background: #f8fafc;
  cursor: pointer;
  font-size: 0.875rem;
}
.collapseBtn:hover { background: #e2e8f0; }
`;

  return { tsx, css };
}

// ── 6.4 Navigation (tabs, breadcrumbs, menus) ──

function genNavigation(
  comp: ComponentPlan, children: ComponentPlan[],
  cssName: string, tier: string, rng: ReturnType<typeof createPRNG>
): { tsx: string; css: string } {
  const tsx = `import { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';
${buildChildImports(comp, children)}
import styles from './${comp.name}.module.css';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  disabled?: boolean;
  badge?: number;
  children?: NavItem[];
}

interface ${comp.name}Props {
  items: NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pills' | 'underline' | 'bordered';
  className?: string;
}

export default function ${comp.name}({
  items,
  activeId,
  onSelect,
  orientation = 'horizontal',
  size = 'md',
  variant = 'underline',
  className,
}: ${comp.name}Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleSelect = useCallback(
    (item: NavItem) => {
      if (item.disabled) return;
      if (item.children?.length) {
        setExpandedIds(prev => {
          const next = new Set(prev);
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        });
      } else {
        onSelect?.(item.id);
      }
    },
    [onSelect]
  );

  const activeItem = useMemo(
    () => items.find(item => item.id === activeId),
    [items, activeId]
  );

  const navClasses = clsx(
    styles.nav,
    styles[orientation],
    styles[\`size-\${size}\`],
    styles[variant],
    className
  );

  const renderItem = (item: NavItem, depth = 0) => {
    const isActive = item.id === activeId;
    const isHovered = item.id === hoveredId;
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = (item.children?.length ?? 0) > 0;

    return (
      <li key={item.id} className={styles.itemWrapper}>
        <button
          className={clsx(
            styles.item,
            isActive && styles.active,
            isHovered && styles.hovered,
            item.disabled && styles.disabled,
            depth > 0 && styles.nested
          )}
          onClick={() => handleSelect(item)}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
          aria-current={isActive ? 'page' : undefined}
          disabled={item.disabled}
          style={{ paddingLeft: \`\${0.75 + depth * 1}rem\` }}
        >
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span className={styles.label}>{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className={styles.badge}>{item.badge > 99 ? '99+' : item.badge}</span>
          )}
          {hasChildren && (
            <span className={clsx(styles.chevron, isExpanded && styles.rotated)}>▾</span>
          )}
        </button>
        {hasChildren && isExpanded && (
          <ul className={styles.subList}>
            {item.children!.map(child => renderItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className={navClasses} aria-label="${comp.name}">
      {activeItem && (
        <div className={styles.activeIndicator}>
          Current: {activeItem.label}
        </div>
      )}
      <ul className={styles.list}>
        {items.map(item => renderItem(item))}
      </ul>
${children.length > 0 ? `      <div className={styles.extra}>
${buildChildRender(children)}
      </div>` : ''}
    </nav>
  );
}
`;

  const css = `.nav { display: flex; flex-direction: column; }
.horizontal .list { flex-direction: row; }
.vertical .list { flex-direction: column; }
.list { display: flex; list-style: none; padding: 0; margin: 0; gap: 0.125rem; }
.subList { list-style: none; padding: 0; margin: 0; }
.itemWrapper { display: flex; flex-direction: column; }
.item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  color: #4b5563;
  border-radius: 0.375rem;
  width: 100%;
  text-align: left;
  transition: all 0.15s ease;
}
.item:hover { background: #f3f4f6; color: #111827; }
.active { color: #2563eb; font-weight: 600; }
.underline .active { border-bottom: 2px solid #2563eb; border-radius: 0; }
.pills .active { background: #eff6ff; }
.bordered .active { border: 1px solid #bfdbfe; background: #eff6ff; }
.hovered { background: #f9fafb; }
.disabled { opacity: 0.5; cursor: not-allowed; }
.nested { font-size: 0.8125rem; }
.size-sm .item { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
.size-lg .item { padding: 0.75rem 1rem; font-size: 1rem; }
.icon { display: flex; font-size: 1.125em; }
.label { flex: 1; }
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  border-radius: 9999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 600;
}
.chevron { font-size: 0.75rem; transition: transform 0.15s ease; }
.rotated { transform: rotate(180deg); }
.activeIndicator { font-size: 0.75rem; color: #6b7280; padding: 0.25rem 0.75rem; }
.extra { margin-top: 0.75rem; }
`;

  return { tsx, css };
}

// ── 6.5 Feedback (modals, toasts, alerts) ──

function genFeedback(
  comp: ComponentPlan, children: ComponentPlan[],
  cssName: string, tier: string, rng: ReturnType<typeof createPRNG>
): { tsx: string; css: string } {
  const tsx = `import { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
${buildChildImports(comp, children)}
import styles from './${comp.name}.module.css';

type Severity = 'info' | 'success' | 'warning' | 'error';

interface ${comp.name}Props {
  open?: boolean;
  severity?: Severity;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export default function ${comp.name}({
  open: controlledOpen,
  severity = 'info',
  title,
  message,
  duration = 5000,
  dismissible = true,
  onClose,
  onAction,
  actionLabel = 'Dismiss',
  className,
}: ${comp.name}Props) {
  const [internalOpen, setInternalOpen] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      if (!isControlled) setInternalOpen(false);
      setIsExiting(false);
      onClose?.();
    }, 200);
  }, [isControlled, onClose]);

  useEffect(() => {
    if (isOpen && duration > 0 && dismissible) {
      timerRef.current = setTimeout(handleClose, duration);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [isOpen, duration, dismissible, handleClose]);

  const handleAction = useCallback(() => {
    onAction?.();
    handleClose();
  }, [onAction, handleClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) handleClose();
    },
    [dismissible, handleClose]
  );

  if (!isOpen) return null;

  const severityIcons: Record<Severity, string> = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕',
  };

  return (
    <div
      className={clsx(
        styles.container,
        styles[severity],
        isExiting && styles.exiting,
        className
      )}
      role="alert"
      aria-live="polite"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{severityIcons[severity]}</span>
      </div>

      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{message}</div>
      </div>

      <div className={styles.actions}>
        {onAction && (
          <button className={styles.actionBtn} onClick={handleAction}>
            {actionLabel}
          </button>
        )}
        {dismissible && (
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>

${children.length > 0 ? `      <div className={styles.extra}>
${buildChildRender(children)}
      </div>` : ''}
    </div>
  );
}
`;

  const css = `.container {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid;
  animation: slideIn 0.2s ease;
}
.exiting { animation: slideOut 0.2s ease forwards; }
@keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }
.info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
.success { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.error { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.iconWrapper { flex-shrink: 0; font-size: 1.125rem; margin-top: 0.0625rem; }
.body { flex: 1; min-width: 0; }
.title { font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem; }
.message { font-size: 0.8125rem; line-height: 1.5; }
.actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.actionBtn {
  padding: 0.25rem 0.625rem;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  color: inherit;
}
.actionBtn:hover { opacity: 0.8; }
.closeBtn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  line-height: 1;
}
.closeBtn:hover { opacity: 1; }
.extra { width: 100%; margin-top: 0.5rem; }
`;

  return { tsx, css };
}

// ── 6.6 Data Fetching (loaders, error boundaries) ──

function genDataFetching(
  comp: ComponentPlan, children: ComponentPlan[],
  cssName: string, tier: string, rng: ReturnType<typeof createPRNG>
): { tsx: string; css: string } {
  const hasQuery = (tier === 'l' || tier === 'xl');

  const tsx = `import { useState, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
${buildChildImports(comp, children)}
import styles from './${comp.name}.module.css';

interface FetchState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isRefetching: boolean;
}

interface ${comp.name}Props<T = unknown> {
  url?: string;
  fetchFn?: () => Promise<T>;
  children?: (state: FetchState<T>) => React.ReactNode;
  retryCount?: number;
  retryDelay?: number;
  staleTime?: number;
  placeholder?: React.ReactNode;
  errorFallback?: (error: string, retry: () => void) => React.ReactNode;
  className?: string;
}

export default function ${comp.name}<T = unknown>({
  url,
  fetchFn,
  children: renderProp,
  retryCount = 3,
  retryDelay = 1000,
  staleTime = 30000,
  placeholder,
  errorFallback,
  className,
}: ${comp.name}Props<T>) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    isLoading: true,
    isRefetching: false,
  });
  const mountedRef = useRef(true);
  const retriesRef = useRef(0);
  const lastFetchRef = useRef<number>(0);

  const executeFetch = useCallback(async (isRefetch = false) => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      isLoading: !isRefetch,
      isRefetching: isRefetch,
      error: null,
    }));

    try {
      let data: T;
      if (fetchFn) {
        data = await fetchFn();
      } else if (url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        data = await response.json() as T;
      } else {
        throw new Error('No url or fetchFn provided');
      }

      if (mountedRef.current) {
        setState({ data, error: null, isLoading: false, isRefetching: false });
        lastFetchRef.current = Date.now();
        retriesRef.current = 0;
      }
    } catch (err) {
      if (!mountedRef.current) return;

      if (retriesRef.current < retryCount) {
        retriesRef.current += 1;
        setTimeout(() => executeFetch(isRefetch), retryDelay * retriesRef.current);
      } else {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Unknown error',
          isLoading: false,
          isRefetching: false,
        }));
      }
    }
  }, [url, fetchFn, retryCount, retryDelay]);

  useEffect(() => {
    mountedRef.current = true;
    executeFetch();
    return () => { mountedRef.current = false; };
  }, [executeFetch]);

  const handleRetry = useCallback(() => {
    retriesRef.current = 0;
    executeFetch();
  }, [executeFetch]);

  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchRef.current < staleTime) return;
    executeFetch(true);
  }, [executeFetch, staleTime]);

  if (state.isLoading) {
    return (
      <div className={clsx(styles.container, styles.loading, className)}>
        {placeholder || (
          <div className={styles.skeleton}>
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
            <div className={styles.skeletonLine} style={{ width: '80%' }} />
            <div className={styles.skeletonLine} style={{ width: '40%' }} />
          </div>
        )}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={clsx(styles.container, styles.error, className)}>
        {errorFallback ? errorFallback(state.error, handleRetry) : (
          <div className={styles.errorContent}>
            <span className={styles.errorIcon}>⚠</span>
            <p className={styles.errorMessage}>{state.error}</p>
            <button className={styles.retryBtn} onClick={handleRetry}>
              Retry ({retriesRef.current}/{retryCount} attempts)
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      {state.isRefetching && <div className={styles.refetchIndicator}>Refreshing…</div>}
      <button className={styles.refreshBtn} onClick={handleRefresh}>
        ↻ Refresh
      </button>
      {renderProp ? renderProp(state) : (
        <pre className={styles.raw}>{JSON.stringify(state.data, null, 2)}</pre>
      )}
${children.length > 0 ? `      <div className={styles.related}>
${buildChildRender(children)}
      </div>` : ''}
    </div>
  );
}
`;

  const css = `.container {
  position: relative;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #ffffff;
}
.loading { min-height: 8rem; display: flex; align-items: center; justify-content: center; }
.error { border-color: #fecaca; background: #fef2f2; }
.skeleton { display: flex; flex-direction: column; gap: 0.625rem; width: 100%; }
.skeletonLine {
  height: 0.875rem;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.25rem;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.errorContent { text-align: center; padding: 1rem; }
.errorIcon { font-size: 1.5rem; }
.errorMessage { color: #991b1b; margin: 0.5rem 0; font-size: 0.875rem; }
.retryBtn {
  padding: 0.375rem 1rem;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  background: #ffffff;
  color: #dc2626;
  cursor: pointer;
  font-size: 0.8125rem;
}
.retryBtn:hover { background: #fef2f2; }
.refetchIndicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  animation: pulse 1s infinite;
}
@keyframes pulse { 50% { opacity: 0.5; } }
.refreshBtn {
  margin-bottom: 0.75rem;
  padding: 0.25rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: #f9fafb;
  cursor: pointer;
  font-size: 0.75rem;
}
.refreshBtn:hover { background: #f3f4f6; }
.raw { font-size: 0.75rem; overflow-x: auto; background: #f8fafc; padding: 0.75rem; border-radius: 0.25rem; }
.related { margin-top: 1rem; }
`;

  return { tsx, css };
}

// ── 6.7 Chart/Viz (recharts wrappers) ──

function genChartViz(
  comp: ComponentPlan, children: ComponentPlan[],
  cssName: string, tier: string, rng: ReturnType<typeof createPRNG>
): { tsx: string; css: string } {
  const chartType = rng.pick(['bar', 'line', 'area', 'pie']);
  const hasRecharts = tier === 'm' || tier === 'l' || tier === 'xl';

  const tsx = `import { useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
${hasRecharts ? `import {
  ResponsiveContainer,
  ${chartType === 'bar' ? 'BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend' : ''}${chartType === 'line' ? 'LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend' : ''}${chartType === 'area' ? 'AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend' : ''}${chartType === 'pie' ? 'PieChart, Pie, Cell, Tooltip, Legend' : ''},
} from 'recharts';` : ''}
${buildChildImports(comp, children)}
import styles from './${comp.name}.module.css';

interface DataPoint {
  name: string;
  value: number;
  secondary?: number;
  category?: string;
}

interface ${comp.name}Props {
  data: DataPoint[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange';
  className?: string;
  onDataClick?: (point: DataPoint) => void;
}

const COLOR_SCHEMES = {
  blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
  green: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
  purple: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  orange: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
};

export default function ${comp.name}({
  data,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  colorScheme = 'blue',
  className,
  onDataClick,
}: ${comp.name}Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const colors = useMemo(() => COLOR_SCHEMES[colorScheme], [colorScheme]);

  const processedData = useMemo(() => {
    if (!data?.length) return [];
    return data.map((d, i) => ({
      ...d,
      fill: colors[i % colors.length],
    }));
  }, [data, colors]);

  const stats = useMemo(() => {
    if (!data?.length) return { total: 0, avg: 0, max: 0, min: 0 };
    const values = data.map(d => d.value);
    return {
      total: values.reduce((s, v) => s + v, 0),
      avg: values.reduce((s, v) => s + v, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
    };
  }, [data]);

  const handleClick = useCallback(
    (point: DataPoint, index: number) => {
      setActiveIndex(prev => (prev === index ? null : index));
      onDataClick?.(point);
    },
    [onDataClick]
  );

  if (!processedData.length) {
    return (
      <div className={clsx(styles.container, styles.empty, className)}>
        <p className={styles.emptyText}>No data available</p>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      {title && <h3 className={styles.title}>{title}</h3>}

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statValue}>{stats.total.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Average</span>
          <span className={styles.statValue}>{stats.avg.toFixed(1)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Range</span>
          <span className={styles.statValue}>{stats.min}–{stats.max}</span>
        </div>
      </div>

${hasRecharts ? `      <div className={styles.chartWrapper} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
${chartType === 'bar' ? `          <BarChart data={processedData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {showLegend && <Legend />}
            <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
            {processedData[0]?.secondary != null && (
              <Bar dataKey="secondary" fill={colors[1]} radius={[4, 4, 0, 0]} />
            )}
          </BarChart>` : chartType === 'line' ? `          <LineChart data={processedData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {showLegend && <Legend />}
            <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>` : chartType === 'area' ? `          <AreaChart data={processedData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {showLegend && <Legend />}
            <Area type="monotone" dataKey="value" stroke={colors[0]} fill={colors[3]} />
          </AreaChart>` : `          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              dataKey="value"
              onClick={(_, idx) => handleClick(processedData[idx], idx)}
            >
              {processedData.map((entry, idx) => (
                <Cell
                  key={entry.name}
                  fill={colors[idx % colors.length]}
                  opacity={activeIndex === null || activeIndex === idx ? 1 : 0.4}
                />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>`}
        </ResponsiveContainer>
      </div>` : `      <div className={styles.chartWrapper} style={{ height }}>
        <div className={styles.simpleBars}>
          {processedData.map((d, i) => (
            <div
              key={d.name}
              className={clsx(styles.simpleBar, activeIndex === i && styles.activeBar)}
              onClick={() => handleClick(d, i)}
            >
              <div
                className={styles.barFill}
                style={{
                  height: \`\${(d.value / stats.max) * 100}%\`,
                  background: d.fill,
                }}
              />
              <span className={styles.barLabel}>{d.name}</span>
            </div>
          ))}
        </div>
      </div>`}

${children.length > 0 ? `      <div className={styles.extra}>
${buildChildRender(children)}
      </div>` : ''}
    </div>
  );
}
`;

  const css = `.container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #ffffff;
}
.empty { align-items: center; justify-content: center; min-height: 12rem; }
.emptyText { color: #94a3b8; font-size: 0.875rem; }
.title { font-size: 1rem; font-weight: 600; color: #1e293b; margin: 0; }
.statsRow { display: flex; gap: 1.5rem; }
.stat { display: flex; flex-direction: column; }
.statLabel { font-size: 0.6875rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.statValue { font-size: 1.125rem; font-weight: 600; color: #1e293b; }
.chartWrapper { width: 100%; }
.simpleBars { display: flex; align-items: flex-end; gap: 0.5rem; height: 100%; padding: 1rem 0; }
.simpleBar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  cursor: pointer;
}
.barFill { width: 100%; border-radius: 0.25rem 0.25rem 0 0; transition: opacity 0.15s; min-height: 4px; }
.activeBar .barFill { opacity: 0.8; }
.barLabel { font-size: 0.6875rem; color: #64748b; margin-top: 0.375rem; text-align: center; }
.extra { margin-top: 0.75rem; }
`;

  return { tsx, css };
}

// ── 6.8 Utility (HOCs, context providers, hooks) ──

function genUtility(
  comp: ComponentPlan, children: ComponentPlan[],
  cssName: string, tier: string, rng: ReturnType<typeof createPRNG>
): { tsx: string; css: string } {
  const tsx = `import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
${buildChildImports(comp, children)}

interface ${comp.name}State {
  isActive: boolean;
  count: number;
  label: string;
  metadata: Record<string, unknown>;
}

interface ${comp.name}ContextValue {
  state: ${comp.name}State;
  toggle: () => void;
  increment: () => void;
  reset: () => void;
  updateLabel: (label: string) => void;
  setMeta: (key: string, value: unknown) => void;
}

const ${comp.name}Context = createContext<${comp.name}ContextValue | null>(null);

export function use${comp.name}() {
  const ctx = useContext(${comp.name}Context);
  if (!ctx) {
    throw new Error(\`use${comp.name} must be used within a ${comp.name}\`);
  }
  return ctx;
}

interface ${comp.name}Props {
  children: ReactNode;
  initialActive?: boolean;
  initialLabel?: string;
}

export default function ${comp.name}({
  children,
  initialActive = false,
  initialLabel = '${comp.name}',
}: ${comp.name}Props) {
  const [state, setState] = useState<${comp.name}State>({
    isActive: initialActive,
    count: 0,
    label: initialLabel,
    metadata: {},
  });

  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, isActive: !prev.isActive }));
  }, []);

  const increment = useCallback(() => {
    setState(prev => ({ ...prev, count: prev.count + 1 }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isActive: initialActive,
      count: 0,
      label: initialLabel,
      metadata: {},
    });
  }, [initialActive, initialLabel]);

  const updateLabel = useCallback((label: string) => {
    setState(prev => ({ ...prev, label }));
  }, []);

  const setMeta = useCallback((key: string, value: unknown) => {
    setState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value },
    }));
  }, []);

  const contextValue = useMemo<${comp.name}ContextValue>(
    () => ({ state, toggle, increment, reset, updateLabel, setMeta }),
    [state, toggle, increment, reset, updateLabel, setMeta]
  );

  return (
    <${comp.name}Context.Provider value={contextValue}>
      {children}
${children.length > 0 ? buildChildRender(children) : ''}
    </${comp.name}Context.Provider>
  );
}
`;

  const css = `/* Utility component — no visual styles needed */
`;

  return { tsx, css };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7. Support File Generators (utils, types, entry point)
// ─────────────────────────────────────────────────────────────────────────────

function generateSharedUtils(): string {
  return `export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(d);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return \`\${minutes}m ago\`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return \`\${hours}h ago\`;
  const days = Math.floor(hours / 24);
  return \`\${days}d ago\`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

export function uniqueBy<T>(items: T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  return items.filter(item => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function randomId(prefix = 'id'): string {
  return \`\${prefix}_\${Math.random().toString(36).slice(2, 11)}\`;
}
`;
}

function generateSharedTypes(): string {
  return `export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
}

export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  status: 'draft' | 'active' | 'archived';
  imageUrl?: string;
  stock: number;
}

export interface Order extends BaseEntity {
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  actionUrl?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
`;
}

function generateAppEntry(
  components: ComponentPlan[],
  tier: string
): { appTsx: string; mainTsx: string; indexHtml: string } {
  const routeEntries = components.filter(c => c.isRouteEntry);
  const hasRoutes = routeEntries.length > 0;
  const nonRouteNonDead = components.filter(c => !c.isRouteEntry && !c.isDeadModule);
  const topComponents = nonRouteNonDead.slice(0, Math.min(5, nonRouteNonDead.length));

  const appTsx = `import { ${hasRoutes ? "Suspense, lazy" : "Suspense"} } from 'react';
${hasRoutes ? "import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';" : ''}
${topComponents.map(c => `import ${c.name} from './${c.filePath.replace('src/', '').replace('.tsx', '')}';`).join('\n')}
import './App.css';

${hasRoutes ? routeEntries.map(c =>
    `const ${c.name}Page = lazy(() => import('./${c.filePath.replace('src/', '').replace('.tsx', '')}'));`
  ).join('\n') : ''}

function App() {
  return (
${hasRoutes ? `    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <h1 className="logo">${tier === 'xs' ? 'TaskBoard' : tier === 's' ? 'TaskBoard' : tier === 'm' ? 'ShopDash' : 'MegaRepo'}</h1>
          <ul className="nav-links">
${routeEntries.map(c => `            <li><Link to="/${c.featureFolder}">${capitalize(c.featureFolder)}</Link></li>`).join('\n')}
          </ul>
        </nav>
        <main className="main">
          <Suspense fallback={<div className="loading">Loading…</div>}>
            <Routes>
              <Route path="/" element={<div className="home">${topComponents.map(c => `<${c.name} />`).join(' ')}</div>} />
${routeEntries.map(c => `              <Route path="/${c.featureFolder}/*" element={<${c.name}Page />} />`).join('\n')}
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>` : `    <div className="app">
      <header className="header">
        <h1>TaskBoard</h1>
      </header>
      <main className="main">
${topComponents.map(c => `        <${c.name} />`).join('\n')}
      </main>
    </div>`}
  );
}

export default App;
`;

  const mainTsx = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JS Bundler Benchmark — ${tier.toUpperCase()}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  return { appTsx, mainTsx, indexHtml };
}

function generateAppCss(): string {
  return `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #f8fafc; }
.app { min-height: 100vh; display: flex; flex-direction: column; }
.header, .nav { padding: 1rem 2rem; background: #ffffff; border-bottom: 1px solid #e2e8f0; }
.logo { font-size: 1.25rem; font-weight: 700; }
.nav { display: flex; align-items: center; gap: 2rem; }
.nav-links { display: flex; list-style: none; gap: 1rem; }
.nav-links a { color: #3b82f6; text-decoration: none; font-size: 0.875rem; }
.nav-links a:hover { text-decoration: underline; }
.main { flex: 1; padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1rem; }
.home { display: flex; flex-direction: column; gap: 1rem; }
.loading { padding: 2rem; text-align: center; color: #94a3b8; }
`;
}

function generatePackageJson(tier: string, size: number): string {
  const { dependencies, devDependencies } = getDeps(tier);
  return JSON.stringify({
    name: `benchmark-${tier}-${size}`,
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'echo "Configure bundler-specific dev script"',
      build: 'echo "Configure bundler-specific build script"',
    },
    dependencies,
    devDependencies,
  }, null, 2) + '\n';
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      lib: ['DOM', 'DOM.Iterable', 'ES2022'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
    },
    include: ['src'],
  }, null, 2) + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// § 8. File Writer
// ─────────────────────────────────────────────────────────────────────────────

function writeFile(basePath: string, relPath: string, content: string): void {
  const fullPath = path.join(basePath, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// § 9. Helpers
// ─────────────────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str.replace(/(^|[-_])(\w)/g, (_, _sep, char) => char.toUpperCase());
}

// ─────────────────────────────────────────────────────────────────────────────
// § 10. Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  const config = parseArgs();
  const rng = createPRNG(config.seed);
  const sizeConfig = getSizeConfig(config.size);

  console.log(`\n🏗️  Generating ${config.size}-module project (tier: ${sizeConfig.tier}, seed: ${config.seed})`);
  console.log(`   Output: ${config.outputDir}\n`);

  // Step 1: Plan components
  console.log('  [1/6] Planning component graph...');
  const components = planComponents(config, rng);

  // Step 2: Build dependency graph
  console.log('  [2/6] Building dependency graph...');
  buildDependencyGraph(components, rng);

  // Step 3: Generate components
  console.log('  [3/6] Generating components...');
  let totalLines = 0;
  for (const comp of components) {
    const { tsx, css } = generateComponent(comp, components, sizeConfig.tier, rng);
    writeFile(config.outputDir, comp.filePath, tsx);
    writeFile(config.outputDir, comp.cssPath, css);
    totalLines += tsx.split('\n').length + css.split('\n').length;
  }

  // Step 4: Generate shared files
  console.log('  [4/6] Generating shared utilities & types...');
  writeFile(config.outputDir, 'src/utils/helpers.ts', generateSharedUtils());
  writeFile(config.outputDir, 'src/types/index.ts', generateSharedTypes());
  writeFile(config.outputDir, 'src/App.css', generateAppCss());

  // Step 5: Generate entry point
  console.log('  [5/6] Generating entry point & config...');
  const { appTsx, mainTsx, indexHtml } = generateAppEntry(components, sizeConfig.tier);
  writeFile(config.outputDir, 'src/App.tsx', appTsx);
  writeFile(config.outputDir, 'src/main.tsx', mainTsx);
  writeFile(config.outputDir, 'index.html', indexHtml);
  writeFile(config.outputDir, 'package.json', generatePackageJson(sizeConfig.tier, config.size));
  writeFile(config.outputDir, 'tsconfig.json', generateTsConfig());

  // Step 6: Report
  console.log('  [6/6] Writing manifest...');
  const deadCount = components.filter(c => c.isDeadModule).length;
  const routeCount = components.filter(c => c.isRouteEntry).length;
  const totalImports = components.reduce((s, c) => s + c.imports.length, 0);
  const categories = new Map<string, number>();
  for (const c of components) {
    categories.set(c.category, (categories.get(c.category) || 0) + 1);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    seed: config.seed,
    size: config.size,
    tier: sizeConfig.tier,
    components: components.length,
    deadModules: deadCount,
    routeEntries: routeCount,
    totalImportEdges: totalImports,
    totalSourceLines: totalLines,
    featureFolders: sizeConfig.featureFolders,
    categoryDistribution: Object.fromEntries(categories),
  };
  writeFile(config.outputDir, 'MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\n✅ Done! Generated ${components.length} components`);
  console.log(`   📁 Feature folders: ${sizeConfig.featureFolders}`);
  console.log(`   🔗 Import edges: ${totalImports}`);
  console.log(`   🗑️  Dead modules: ${deadCount} (${((deadCount / components.length) * 100).toFixed(1)}%)`);
  console.log(`   🛣️  Route entries: ${routeCount}`);
  console.log(`   📝 Total source lines: ~${totalLines.toLocaleString()}`);
  console.log(`   📊 Categories: ${[...categories.entries()].map(([k, v]) => `${k}:${v}`).join(', ')}\n`);
}

main();
