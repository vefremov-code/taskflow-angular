import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type StrategyKey = 'default' | 'onpush' | 'signals';

type DemoTaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';

interface DemoTask {
  id: number;
  title: string;
  status: DemoTaskStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface StrategyMetrics {
  strategy: StrategyKey;
  label: string;
  checkedComponents: number;
  bindingsEvaluated: number;
  domUpdates: number;
  wastedChecks: number;
  estimatedWork: string;
  explanation: string;
}

interface TimelineEntry {
  id: number;
  message: string;
}

const TASK_COUNT = 200;
const BINDINGS_PER_TASK_CARD = 8;

@Component({
  selector: 'app-performance-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="performance-page">
      <header class="hero">
        <div>
          <p class="eyebrow">Chapter 12</p>
          <h1>Performance and Change Detection Lab</h1>
          <p class="hero__copy">
            Compare Default, OnPush, and Signals-based rendering using the same visible update:
            one task status changes inside a simulated 200-task dashboard.
          </p>
        </div>

        <div class="hero__badge">
          Same UI update<br />different rendering cost
        </div>
      </header>

      <section class="concept-grid" aria-label="Change detection mental model">
        <article class="concept-card concept-card--default">
          <span class="concept-card__label">Default</span>
          <h2>Check everything</h2>
          <p>
            Zone.js detects that something asynchronous happened, then Angular walks the component tree
            and evaluates every reachable binding.
          </p>
        </article>

        <article class="concept-card concept-card--onpush">
          <span class="concept-card__label">OnPush</span>
          <h2>Check when required</h2>
          <p>
            Components are skipped unless an input reference changes, an event fires, an async pipe emits,
            markForCheck is called, or a signal read by the template changes.
          </p>
        </article>

        <article class="concept-card concept-card--signals">
          <span class="concept-card__label">Signals</span>
          <h2>Update exact consumers</h2>
          <p>
            Signal reads create reactive dependencies. When a signal changes, Angular marks only the
            components that consumed that signal.
          </p>
        </article>
      </section>

      <section class="lab-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Scenario 1</p>
            <h2>One Task Update in a 200-Task List</h2>
            <p>
              All three buttons produce the same visible result: one task status changes.
              The difference is how much work Angular performs behind the scenes.
            </p>
          </div>

          <button type="button" class="btn btn--ghost" (click)="resetLab()">
            Reset metrics
          </button>
        </div>

        <div class="simulation-actions">
          <button type="button" class="btn btn--default" (click)="runDefaultStrategy()">
            Run Default check
          </button>

          <button type="button" class="btn btn--onpush" (click)="runOnPushStrategy()">
            Run OnPush check
          </button>

          <button type="button" class="btn btn--signals" (click)="runSignalStrategy()">
            Run Signal update
          </button>
        </div>

        <div class="metrics-grid" aria-label="Current performance metrics">
          <article class="metric-card">
            <span class="metric-card__label">Strategy</span>
            <strong>{{ currentMetrics().label }}</strong>
          </article>

          <article class="metric-card">
            <span class="metric-card__label">Components checked</span>
            <strong>{{ currentMetrics().checkedComponents }}</strong>
          </article>

          <article class="metric-card">
            <span class="metric-card__label">Bindings evaluated</span>
            <strong>{{ currentMetrics().bindingsEvaluated }}</strong>
          </article>

          <article class="metric-card">
            <span class="metric-card__label">DOM updates</span>
            <strong>{{ currentMetrics().domUpdates }}</strong>
          </article>

          <article class="metric-card">
            <span class="metric-card__label">Wasted checks</span>
            <strong>{{ currentMetrics().wastedChecks }}</strong>
          </article>

          <article class="metric-card">
            <span class="metric-card__label">Estimated work</span>
            <strong>{{ currentMetrics().estimatedWork }}</strong>
          </article>
        </div>

        <div class="result-panel">
          <h3>{{ currentMetrics().label }} result</h3>
          <p>{{ currentMetrics().explanation }}</p>
        </div>
      </section>

      <section class="two-column">
        <article class="lab-card">
          <div class="section-heading section-heading--compact">
            <div>
              <p class="eyebrow">Scenario 2</p>
              <h2>Task List Snapshot</h2>
              <p>
                The sample below represents a small visible slice of the simulated 200-task list.
                The highlighted card is the one updated by the latest performance run.
              </p>
            </div>
          </div>

          <div class="task-list" aria-label="Visible task slice">
            @for (task of visibleTasks(); track task.id) {
              <article
                class="task-row"
                [class.task-row--updated]="task.id === updatedTaskId()"
              >
                <div>
                  <strong>#{{ task.id }} — {{ task.title }}</strong>
                  <span>Priority: {{ task.priority }}</span>
                </div>

                <span class="status-pill" [class]="'status-pill status-pill--' + task.status">
                  {{ formatStatus(task.status) }}
                </span>
              </article>
            }
          </div>
        </article>

        <article class="lab-card">
          <div class="section-heading section-heading--compact">
            <div>
              <p class="eyebrow">Scenario 3</p>
              <h2>Render Timeline</h2>
              <p>
                Each lab action records the trigger, rendering strategy, and resulting amount of work.
              </p>
            </div>
          </div>

          <div class="timeline" aria-label="Render timeline">
            @for (entry of timeline(); track entry.id) {
              <div class="timeline__entry">
                {{ entry.message }}
              </div>
            } @empty {
              <p class="empty-state">
                Run a strategy above to populate the timeline.
              </p>
            }
          </div>
        </article>
      </section>

      <section class="lab-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Scenario 4</p>
            <h2>Template Performance Patterns</h2>
            <p>
              These patterns reduce work inside large lists and high-frequency update scenarios.
            </p>
          </div>
        </div>

        <div class="pattern-grid">
          <article class="pattern-card">
            <h3>Use stable tracking</h3>
            <pre><code>&#64;for (task of tasks(); track task.id) &#123; ... &#125;</code></pre>
            <p>
              Tracking by stable identity prevents Angular from destroying and recreating unaffected rows
              when the list is filtered or reordered.
            </p>
          </article>

          <article class="pattern-card">
            <h3>Prefer computed values</h3>
            <pre><code>isOverdue = computed(() => checkDueDate(task()))</code></pre>
            <p>
              A computed signal is cached until its dependencies change. A template method call can run
              repeatedly during change detection.
            </p>
          </article>

          <article class="pattern-card">
            <h3>Avoid inline work</h3>
            <pre><code>&lt;span&gt;{{ '{' }}{{ '{' }} format(task.dueDate) {{ '}' }}{{ '}' }}&lt;/span&gt;</code></pre>
            <p>
              Formatting and filtering inside templates scales poorly in large lists. Move derived display
              logic into computed signals or pure pipes.
            </p>
          </article>
        </div>
      </section>

      <section class="lab-card lab-card--summary">
        <div>
          <p class="eyebrow">Decision summary</p>
          <h2>Performance as Architecture</h2>
          <p>
            Performance improves when the application gives Angular precise information about state changes.
            Signals and OnPush are not tricks; they are architectural constraints that reduce unnecessary work.
          </p>
        </div>

        <div class="summary-list">
          <span>Default → broad traversal</span>
          <span>OnPush → controlled triggers</span>
          <span>Signals → targeted consumers</span>
          <span>track task.id → stable DOM reuse</span>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: calc(100vh - 64px);
      color: #0f172a;
    }

    .performance-page {
      max-width: 1240px;
      margin: 0 auto;
      padding: 32px;
    }

    .hero,
    .lab-card,
    .concept-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 22px;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
    }

    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: center;
      padding: 32px;
      margin-bottom: 24px;
    }

    .hero h1,
    .section-heading h2,
    .concept-card h2,
    .lab-card h2,
    .pattern-card h3 {
      margin: 0;
    }

    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      line-height: 1;
      letter-spacing: -0.04em;
      margin-bottom: 14px;
    }

    .hero__copy,
    .section-heading p,
    .concept-card p,
    .pattern-card p,
    .lab-card--summary p {
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }

    .hero__badge {
      min-width: 220px;
      border-radius: 18px;
      padding: 20px;
      background: linear-gradient(135deg, #eff6ff, #eef2ff);
      color: #1d4ed8;
      font-weight: 800;
      text-align: center;
    }

    .eyebrow {
      color: #2563eb;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin: 0 0 10px;
    }

    .concept-grid,
    .metrics-grid,
    .pattern-grid,
    .two-column {
      display: grid;
      gap: 18px;
    }

    .concept-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-bottom: 24px;
    }

    .concept-card {
      padding: 22px;
    }

    .concept-card__label {
      display: inline-flex;
      margin-bottom: 14px;
      border-radius: 999px;
      padding: 0.3rem 0.7rem;
      font-weight: 800;
      font-size: 0.8rem;
    }

    .concept-card--default .concept-card__label {
      background: #fee2e2;
      color: #991b1b;
    }

    .concept-card--onpush .concept-card__label {
      background: #fef3c7;
      color: #92400e;
    }

    .concept-card--signals .concept-card__label {
      background: #dcfce7;
      color: #166534;
    }

    .concept-card h2 {
      font-size: 1.2rem;
      margin-bottom: 8px;
    }

    .lab-card {
      padding: 26px;
      margin-bottom: 24px;
    }

    .section-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 22px;
    }

    .section-heading--compact {
      display: block;
    }

    .section-heading h2 {
      font-size: 1.6rem;
      margin-bottom: 8px;
    }

    .simulation-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 22px;
    }

    .btn {
      border: 0;
      border-radius: 999px;
      cursor: pointer;
      font: inherit;
      font-weight: 800;
      padding: 0.8rem 1.15rem;
      transition: transform 140ms ease, box-shadow 140ms ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn--default {
      background: #ef4444;
      color: #ffffff;
      box-shadow: 0 10px 22px rgba(239, 68, 68, 0.22);
    }

    .btn--onpush {
      background: #f59e0b;
      color: #111827;
      box-shadow: 0 10px 22px rgba(245, 158, 11, 0.22);
    }

    .btn--signals {
      background: #22c55e;
      color: #052e16;
      box-shadow: 0 10px 22px rgba(34, 197, 94, 0.22);
    }

    .btn--ghost {
      background: #e2e8f0;
      color: #0f172a;
    }

    .metrics-grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
      margin-bottom: 18px;
    }

    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 16px;
      background: #f8fafc;
    }

    .metric-card__label {
      display: block;
      color: #64748b;
      font-size: 0.78rem;
      font-weight: 800;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .metric-card strong {
      font-size: 1.5rem;
    }

    .result-panel {
      border-left: 5px solid #2563eb;
      background: #eff6ff;
      border-radius: 16px;
      padding: 18px;
    }

    .result-panel h3 {
      margin: 0 0 8px;
    }

    .result-panel p {
      margin: 0;
      color: #334155;
      line-height: 1.6;
    }

    .two-column {
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    }

    .task-list,
    .timeline {
      display: grid;
      gap: 10px;
    }

    .task-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 14px;
      background: #ffffff;
    }

    .task-row--updated {
      border-color: #22c55e;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
    }

    .task-row span {
      display: block;
      color: #64748b;
      font-size: 0.9rem;
      margin-top: 4px;
    }

    .status-pill {
      border-radius: 999px;
      padding: 0.35rem 0.65rem;
      font-size: 0.8rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .status-pill--todo {
      background: #e0f2fe;
      color: #075985;
    }

    .status-pill--in-progress {
      background: #fef3c7;
      color: #92400e;
    }

    .status-pill--done {
      background: #dcfce7;
      color: #166534;
    }

    .status-pill--blocked {
      background: #fee2e2;
      color: #991b1b;
    }

    .timeline__entry,
    .empty-state {
      border-radius: 14px;
      padding: 12px;
      background: #f8fafc;
      color: #334155;
      font-size: 0.95rem;
    }

    .pattern-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .pattern-card {
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 18px;
      background: #ffffff;
    }

    .pattern-card h3 {
      font-size: 1rem;
      margin-bottom: 12px;
    }

    pre {
      overflow-x: auto;
      border-radius: 14px;
      background: #0f172a;
      color: #dbeafe;
      padding: 14px;
      font-size: 0.85rem;
      margin: 0 0 12px;
    }

    .lab-card--summary {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 0.75fr);
      gap: 24px;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
    }

    .lab-card--summary p {
      color: #cbd5e1;
    }

    .summary-list {
      display: grid;
      gap: 10px;
    }

    .summary-list span {
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.7rem 1rem;
      font-weight: 800;
    }

    @media (max-width: 980px) {
      .hero,
      .section-heading,
      .lab-card--summary {
        grid-template-columns: 1fr;
        flex-direction: column;
        align-items: stretch;
      }

      .concept-grid,
      .metrics-grid,
      .pattern-grid,
      .two-column {
        grid-template-columns: 1fr;
      }

      .hero__badge {
        min-width: 0;
      }
    }
  `]
})
export class PerformanceLabComponent {
  private readonly initialTasks = createDemoTasks();

  readonly tasks = signal<DemoTask[]>(this.initialTasks);
  readonly updatedTaskId = signal(47);
  readonly selectedStrategy = signal<StrategyKey>('signals');
  readonly timeline = signal<TimelineEntry[]>([
    {
      id: 1,
      message: 'Ready: run a strategy to compare rendering cost for the same task update.'
    }
  ]);

  readonly visibleTasks = computed(() => {
    const updatedId = this.updatedTaskId();
    const tasks = this.tasks();
    const start = Math.max(0, updatedId - 4);
    return tasks.slice(start, start + 8);
  });

  readonly currentMetrics = computed<StrategyMetrics>(() => {
    const strategy = this.selectedStrategy();

    if (strategy === 'default') {
      return {
        strategy,
        label: 'Default strategy',
        checkedComponents: TASK_COUNT + 3,
        bindingsEvaluated: TASK_COUNT * BINDINGS_PER_TASK_CARD,
        domUpdates: 1,
        wastedChecks: TASK_COUNT - 1,
        estimatedWork: 'High',
        explanation:
          'Default change detection checks the broad component tree after an async event. Only one card changes, but the list still pays the cost of checking nearly every card.'
      };
    }

    if (strategy === 'onpush') {
      return {
        strategy,
        label: 'OnPush strategy',
        checkedComponents: 5,
        bindingsEvaluated: 24,
        domUpdates: 1,
        wastedChecks: 4,
        estimatedWork: 'Medium',
        explanation:
          'OnPush skips most task cards because their input references did not change. The changed card and a small ancestor path are checked.'
      };
    }

    return {
      strategy,
      label: 'Signals-based rendering',
      checkedComponents: 3,
      bindingsEvaluated: 8,
      domUpdates: 1,
      wastedChecks: 0,
      estimatedWork: 'Low',
      explanation:
        'Signals identify the exact reactive consumers of the changed state. Angular targets the affected view instead of speculatively checking the whole list.'
    };
  });

  runDefaultStrategy(): void {
    this.selectedStrategy.set('default');
    this.updateTaskStatus(47, 'done');
    this.addTimeline('Default: Zone.js-style trigger checked the broad tree for one visible task update.');
  }

  runOnPushStrategy(): void {
    this.selectedStrategy.set('onpush');
    this.updateTaskStatus(47, 'blocked');
    this.addTimeline('OnPush: only changed input references and the ancestor path were checked.');
  }

  runSignalStrategy(): void {
    this.selectedStrategy.set('signals');
    this.updateTaskStatus(47, 'in-progress');
    this.addTimeline('Signals: the changed task state marked only dependent consumers dirty.');
  }

  resetLab(): void {
    this.tasks.set(createDemoTasks());
    this.updatedTaskId.set(47);
    this.selectedStrategy.set('signals');
    this.timeline.set([
      {
        id: Date.now(),
        message: 'Reset: metrics returned to the signal-based baseline.'
      }
    ]);
  }

  formatStatus(status: DemoTaskStatus): string {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      case 'blocked':
        return 'Blocked';
    }
  }

  private updateTaskStatus(taskId: number, status: DemoTaskStatus): void {
    this.updatedTaskId.set(taskId);
    this.tasks.update(tasks =>
      tasks.map(task =>
        task.id === taskId
          ? { ...task, status }
          : task
      )
    );
  }

  private addTimeline(message: string): void {
    this.timeline.update(entries => [
      {
        id: Date.now(),
        message
      },
      ...entries
    ].slice(0, 6));
  }
}

function createDemoTasks(): DemoTask[] {
  const statuses: DemoTaskStatus[] = ['todo', 'in-progress', 'done', 'blocked'];
  const priorities: DemoTask['priority'][] = ['low', 'medium', 'high', 'critical'];

  return Array.from({ length: TASK_COUNT }, (_, index) => {
    const id = index + 1;
    return {
      id,
      title: `Performance demo task ${id}`,
      status: statuses[index % statuses.length],
      priority: priorities[index % priorities.length]
    };
  });
}