import { JsonPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TaskService } from '../../core/services/task.service';

interface StrategyCard {
  name: string;
  label: string;
  bestFor: string;
  taskFlowFit: string;
  status: 'recommended' | 'use-case' | 'not-yet';
  points: string[];
}

interface DecisionRow {
  question: string;
  answer: string;
  recommendation: string;
}

interface WarningSign {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface ArchitectureLayer {
  layer: string;
  taskFlowImplementation: string;
  responsibility: string;
  stateTool: string;
}

@Component({
  selector: 'app-state-management-lab',
  standalone: true,
  imports: [JsonPipe, NgClass, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="state-page">
      <section class="hero-card">
        <div>
          <p class="eyebrow">Chapter 15</p>
          <h1>State Management at Scale</h1>
          <p>
            This lab evaluates TaskFlow's current signal-service architecture against
            RxJS, NgRx SignalStore, and full NgRx Store. The goal is not to replace
            the current architecture, but to decide when each state-management strategy
            becomes justified.
          </p>
        </div>

        <div class="hero-actions">
          <a routerLink="/dashboard" class="btn ghost">Dashboard</a>
          <a routerLink="/signals" class="btn ghost">Signals Inspector</a>
          <a routerLink="/rxjs" class="btn ghost">RxJS Lab</a>
        </div>
      </section>

      <section class="decision-banner">
        <div>
          <p class="eyebrow">Current TaskFlow Decision</p>
          <h2>Signal services remain the right architecture</h2>
          <p>
            TaskFlow has API integration, routed feature views, optimistic updates,
            notifications, authentication state, and reactive filtering. Even after
            Chapter 14, the application still has clear state ownership and does not
            require full NgRx action history or time-travel debugging.
          </p>
        </div>

        <div class="score-card">
          <span>NgRx Need Score</span>
          <strong>{{ ngrxNeedScore() }}/10</strong>
          <small>{{ ngrxDecisionLabel() }}</small>
        </div>
      </section>

      <section class="metric-grid" aria-label="Current state-management health">
        <article class="metric-card">
          <span>State Source</span>
          <strong>TaskService</strong>
          <small>root-scoped signal service</small>
        </article>

        <article class="metric-card">
          <span>Total Tasks</span>
          <strong>{{ taskService.totalCount() }}</strong>
          <small>computed signal</small>
        </article>

        <article class="metric-card">
          <span>Completion</span>
          <strong>{{ taskService.completionRate() }}%</strong>
          <small>derived from task signals</small>
        </article>

        <article class="metric-card">
          <span>HTTP Loaded</span>
          <strong>{{ taskService.httpLoaded() ? 'Yes' : 'No' }}</strong>
          <small>API state bridged into signals</small>
        </article>
      </section>

      <section class="strategy-grid">
        @for (strategy of strategies; track strategy.name) {
          <article
            class="strategy-card"
            [ngClass]="'strategy-card--' + strategy.status"
          >
            <div class="strategy-card__header">
              <div>
                <p class="eyebrow">{{ strategy.label }}</p>
                <h2>{{ strategy.name }}</h2>
              </div>
              <span class="status-pill">{{ strategy.taskFlowFit }}</span>
            </div>

            <p><strong>Best for:</strong> {{ strategy.bestFor }}</p>

            <ul>
              @for (point of strategy.points; track point) {
                <li>{{ point }}</li>
              }
            </ul>
          </article>
        }
      </section>

      <section class="panel wide">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Decision Framework</p>
            <h2>Choose the simplest tool that satisfies the real requirement</h2>
          </div>
          <button type="button" class="btn primary" (click)="toggleAdvancedMode()">
            {{ showAdvancedMode() ? 'Hide advanced indicators' : 'Show advanced indicators' }}
          </button>
        </div>

        <div class="decision-table" role="table" aria-label="State management decision table">
          <div class="decision-row decision-row--head" role="row">
            <span>Question</span>
            <span>TaskFlow answer</span>
            <span>Recommendation</span>
          </div>

          @for (row of decisionRows; track row.question) {
            <div class="decision-row" role="row">
              <strong>{{ row.question }}</strong>
              <span>{{ row.answer }}</span>
              <span>{{ row.recommendation }}</span>
            </div>
          }
        </div>
      </section>

      @if (showAdvancedMode()) {
        <section class="panel wide">
          <p class="eyebrow">Scaling Warning Signs</p>
          <h2>When signals would start to strain</h2>

          <div class="warning-grid">
            @for (warning of warningSigns; track warning.title) {
              <article class="warning-card" [ngClass]="'warning-card--' + warning.severity">
                <span>{{ warning.severity }}</span>
                <h3>{{ warning.title }}</h3>
                <p>{{ warning.description }}</p>
              </article>
            }
          </div>
        </section>
      }

      <section class="panel wide">
        <p class="eyebrow">Architecture Map</p>
        <h2>Current TaskFlow state ownership</h2>

        <div class="architecture-table" role="table" aria-label="TaskFlow state architecture map">
          <div class="architecture-row architecture-row--head" role="row">
            <span>Layer</span>
            <span>Implementation</span>
            <span>Responsibility</span>
            <span>State Tool</span>
          </div>

          @for (layer of architectureLayers; track layer.layer) {
            <div class="architecture-row" role="row">
              <strong>{{ layer.layer }}</strong>
              <span>{{ layer.taskFlowImplementation }}</span>
              <span>{{ layer.responsibility }}</span>
              <span>{{ layer.stateTool }}</span>
            </div>
          }
        </div>
      </section>

      <section class="comparison-grid">
        <article class="panel">
          <p class="eyebrow">Signal Service</p>
          <h2>Current TaskFlow pattern</h2>
          <pre>{{ signalServiceExample }}</pre>
        </article>

        <article class="panel">
          <p class="eyebrow">NgRx Threshold</p>
          <h2>What would justify migration?</h2>
          <pre>{{ ngrxThresholdExample }}</pre>
        </article>
      </section>

      <section class="panel wide">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Live Signal Snapshot</p>
            <h2>The existing signal graph still drives the UI</h2>
            <p>
              This snapshot is read directly from <code>TaskService.signalSnapshot()</code>.
              It proves Chapter 15 is evaluating the real application state rather than a separate demo store.
            </p>
          </div>

          <div class="button-row">
            <button type="button" class="btn ghost" (click)="taskService.cycleFirstTaskStatus()">
              Cycle First Task
            </button>
            <button type="button" class="btn ghost" (click)="taskService.loadTasksFromHttp(true)">
              Reload API State
            </button>
          </div>
        </div>

        <pre class="snapshot">{{ taskService.signalSnapshot() | json }}</pre>
      </section>
    </main>
  `,
  styles: [`
    .state-page {
      max-width: 1240px;
      margin: 0 auto;
      padding: 2rem;
      display: grid;
      gap: 1.5rem;
      color: #0f172a;
    }

    .hero-card,
    .decision-banner,
    .metric-card,
    .strategy-card,
    .panel {
      background: #ffffff;
      border: 1px solid #dbe3ef;
      border-radius: 1.25rem;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
    }

    .hero-card,
    .decision-banner,
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .hero-card,
    .decision-banner,
    .panel,
    .strategy-card,
    .metric-card {
      padding: 1.5rem;
    }

    h1,
    h2,
    h3,
    p {
      margin-top: 0;
    }

    .eyebrow {
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      font-weight: 800;
      color: #64748b;
    }

    .hero-card h1,
    .decision-banner h2 {
      margin-bottom: 0.5rem;
    }

    .hero-actions,
    .button-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .btn {
      border: 0;
      border-radius: 999px;
      padding: 0.65rem 1rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn.primary {
      color: #ffffff;
      background: #2563eb;
    }

    .btn.ghost {
      color: #1e293b;
      background: #eef2ff;
    }

    .decision-banner {
      background: linear-gradient(135deg, #eff6ff, #ffffff 55%, #f8fafc);
    }

    .score-card {
      min-width: 190px;
      padding: 1.25rem;
      border-radius: 1rem;
      background: #0f172a;
      color: #ffffff;
      display: grid;
      gap: 0.2rem;
      text-align: center;
    }

    .score-card span,
    .score-card small {
      color: #cbd5e1;
      font-weight: 700;
    }

    .score-card strong {
      font-size: 2.4rem;
      line-height: 1;
    }

    .metric-grid,
    .strategy-grid,
    .comparison-grid,
    .warning-grid {
      display: grid;
      gap: 1rem;
    }

    .metric-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .strategy-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .comparison-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .warning-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .metric-card {
      display: grid;
      gap: 0.3rem;
    }

    .metric-card span,
    .metric-card small {
      color: #64748b;
      font-weight: 700;
    }

    .metric-card strong {
      font-size: 1.6rem;
    }

    .strategy-card {
      border-left: 6px solid #94a3b8;
    }

    .strategy-card--recommended {
      border-left-color: #16a34a;
      background: #f0fdf4;
    }

    .strategy-card--use-case {
      border-left-color: #2563eb;
      background: #eff6ff;
    }

    .strategy-card--not-yet {
      border-left-color: #f97316;
      background: #fff7ed;
    }

    .strategy-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .status-pill {
      border-radius: 999px;
      padding: 0.35rem 0.7rem;
      background: rgba(15, 23, 42, 0.08);
      font-size: 0.8rem;
      font-weight: 800;
      white-space: nowrap;
    }

    ul {
      margin-bottom: 0;
      padding-left: 1.1rem;
    }

    li + li {
      margin-top: 0.4rem;
    }

    .decision-table,
    .architecture-table {
      display: grid;
      gap: 0.65rem;
      margin-top: 1rem;
    }

    .decision-row,
    .architecture-row {
      display: grid;
      gap: 0.75rem;
      align-items: start;
      padding: 0.9rem 1rem;
      border-radius: 0.9rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .decision-row {
      grid-template-columns: 1.1fr 1.1fr 1.2fr;
    }

    .architecture-row {
      grid-template-columns: 0.8fr 1.1fr 1.5fr 0.8fr;
    }

    .decision-row--head,
    .architecture-row--head {
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
    }

    .warning-card {
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      padding: 1rem;
    }

    .warning-card span {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.72rem;
      font-weight: 900;
      color: #64748b;
    }

    .warning-card--low {
      border-left: 5px solid #22c55e;
    }

    .warning-card--medium {
      border-left: 5px solid #f59e0b;
    }

    .warning-card--high {
      border-left: 5px solid #ef4444;
    }

    pre {
      overflow: auto;
      margin: 0;
      padding: 1rem;
      border-radius: 0.9rem;
      background: #0f172a;
      color: #e5e7eb;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    code {
      background: #e2e8f0;
      border-radius: 0.35rem;
      padding: 0.1rem 0.3rem;
    }

    .snapshot {
      margin-top: 1rem;
    }

    @media (max-width: 980px) {
      .hero-card,
      .decision-banner,
      .panel-header {
        flex-direction: column;
      }

      .metric-grid,
      .strategy-grid,
      .comparison-grid,
      .warning-grid {
        grid-template-columns: 1fr;
      }

      .decision-row,
      .architecture-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StateManagementLabComponent {
  readonly taskService = inject(TaskService);

  readonly showAdvancedMode = signal(false);

  readonly ngrxNeedScore = computed(() => {
    let score = 2;

    if (this.taskService.totalCount() > 25) {
      score += 1;
    }

    if (this.taskService.error()) {
      score += 1;
    }

    if (this.showAdvancedMode()) {
      score += 1;
    }

    return Math.min(score, 10);
  });

  readonly ngrxDecisionLabel = computed(() => {
    const score = this.ngrxNeedScore();

    if (score <= 3) {
      return 'Signals are enough';
    }

    if (score <= 6) {
      return 'Consider SignalStore later';
    }

    return 'Full NgRx may be justified';
  });

  readonly strategies: StrategyCard[] = [
    {
      name: 'Signal Service',
      label: 'Current default',
      bestFor: 'shared feature state, derived UI values, route-level state, and medium-complexity Angular apps.',
      taskFlowFit: 'Recommended now',
      status: 'recommended',
      points: [
        'Minimal boilerplate and natural Angular template integration.',
        'TaskService already owns tasks, loading, errors, selection, and computed metrics.',
        'Components read signals and stay unaware of HTTP implementation details.'
      ]
    },
    {
      name: 'RxJS State',
      label: 'Stream-first tool',
      bestFor: 'WebSocket events, debounced search, cancellation, retry, and async workflows.',
      taskFlowFit: 'Use by scenario',
      status: 'use-case',
      points: [
        'TaskFlow already uses RxJS where async stream behavior is the real problem.',
        'toSignal() can bridge Observable pipelines back into signal-driven templates.',
        'BehaviorSubject is useful in older codebases or stream-heavy services.'
      ]
    },
    {
      name: 'NgRx SignalStore',
      label: 'Structured signals',
      bestFor: 'medium-large teams that need more pattern enforcement without full Redux complexity.',
      taskFlowFit: 'Possible later',
      status: 'use-case',
      points: [
        'Keeps signal-native reads while adding patchState() and a clearer store shape.',
        'Useful if TaskFlow grows into multiple complex feature domains.',
        'A middle ground before full NgRx Store becomes necessary.'
      ]
    },
    {
      name: 'Full NgRx Store',
      label: 'Enterprise audit trail',
      bestFor: 'large teams, action history, time-travel debugging, undo/redo, and complex workflows.',
      taskFlowFit: 'Not yet',
      status: 'not-yet',
      points: [
        'Adds actions, reducers, selectors, effects, and Redux DevTools.',
        'Powerful when debugging requires replaying exact state transitions.',
        'Overkill for TaskFlow’s current scale because the signal ownership model is still clear.'
      ]
    }
  ];

  readonly decisionRows: DecisionRow[] = [
    {
      question: 'Is the state local to one component?',
      answer: 'Search fields, dropdown visibility, and UI toggles can stay local.',
      recommendation: 'Use local signals or Reactive Forms.'
    },
    {
      question: 'Is state shared across routed views?',
      answer: 'Tasks, selected task, loading, errors, and metrics are shared.',
      recommendation: 'Use a root-scoped signal service.'
    },
    {
      question: 'Is the workflow stream-based?',
      answer: 'Search debounce, HTTP requests, and realtime events are asynchronous streams.',
      recommendation: 'Use RxJS, then bridge into signals when needed.'
    },
    {
      question: 'Do we need action history or time travel?',
      answer: 'Not for current TaskFlow features.',
      recommendation: 'Do not introduce full NgRx yet.'
    },
    {
      question: 'Would multiple teams need strict conventions?',
      answer: 'Not at the current application size.',
      recommendation: 'Reconsider NgRx SignalStore if the team or feature count grows.'
    }
  ];

  readonly warningSigns: WarningSign[] = [
    {
      title: 'Circular service dependencies',
      description: 'TaskService injects ProjectService while ProjectService also injects TaskService. This usually means state boundaries are unclear.',
      severity: 'high'
    },
    {
      title: 'Cascading updates are hard to trace',
      description: 'One mutation causes several services to update each other and no one can predict the final UI state.',
      severity: 'high'
    },
    {
      title: 'Undo/redo becomes a requirement',
      description: 'Signals can support custom rollback logic, but structured action history becomes more valuable when undo is a central feature.',
      severity: 'medium'
    },
    {
      title: 'Audit trail is required',
      description: 'Compliance, finance, healthcare, or enterprise debugging may require a complete record of every state transition.',
      severity: 'high'
    },
    {
      title: 'Too many service owners',
      description: 'Developers cannot easily answer which service owns a piece of state or which method is allowed to mutate it.',
      severity: 'medium'
    },
    {
      title: 'Template reads stale snapshots',
      description: 'A component stores taskService.tasks() instead of the signal reference taskService.tasks, breaking reactive updates.',
      severity: 'low'
    }
  ];

  readonly architectureLayers: ArchitectureLayer[] = [
    {
      layer: 'Component UI',
      taskFlowImplementation: 'Dashboard, routed task page, task cards',
      responsibility: 'Render state and capture user intent. No HttpClient and no store mutation logic.',
      stateTool: 'Signal reads'
    },
    {
      layer: 'Feature State',
      taskFlowImplementation: 'TaskService',
      responsibility: 'Own task state, selected task, loading state, errors, optimistic updates, and computed metrics.',
      stateTool: 'Signals'
    },
    {
      layer: 'Async Workflows',
      taskFlowImplementation: 'TaskApiService, TaskSearchService, realtime simulation',
      responsibility: 'Handle HTTP, debounce, cancellation, retry, and event streams.',
      stateTool: 'RxJS'
    },
    {
      layer: 'Server Boundary',
      taskFlowImplementation: 'json-server REST API',
      responsibility: 'Persist task state and return JSON responses through HTTP.',
      stateTool: 'REST API'
    },
    {
      layer: 'Future Enterprise Store',
      taskFlowImplementation: 'NgRx Store or SignalStore if needed later',
      responsibility: 'Provide action history, strict state transitions, team conventions, and time-travel debugging.',
      stateTool: 'NgRx'
    }
  ];

  readonly signalServiceExample = `private _tasks = signal<Task[]>([]);
readonly tasks = this._tasks.asReadonly();

readonly doneCount = computed(() =>
  this._tasks().filter(task => task.status === 'done').length
);

updateStatus(taskId: string, status: TaskStatus): void {
  this.updateStatusRemote(taskId, status).subscribe();
}`;

  readonly ngrxThresholdExample = `Choose full NgRx when TaskFlow needs:

- complete action audit trail
- Redux DevTools time-travel debugging
- undo / redo across workflows
- large-team convention enforcement
- complex multi-step state coordination
- regulatory or support replay requirements`;

  toggleAdvancedMode(): void {
    this.showAdvancedMode.update(value => !value);
  }
}