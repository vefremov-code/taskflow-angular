import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import { DatePipe, JsonPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TaskService } from '../../core/services/task.service';
import { NotificationService } from '../../core/services/notification.service';

interface SignalLogEntry {
  id: number;
  time: Date;
  message: string;
  snapshot: unknown;
}

@Component({
  selector: 'app-signal-inspector',
  standalone: true,
  imports: [DatePipe, JsonPipe, NgClass, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="signals-page">
      <header class="signals-header">
        <div>
          <p class="eyebrow">Chapter 9</p>
          <h1>Angular Signals Deep Dive</h1>
          <p>
            This screen makes TaskFlow's signal graph visible. The data still comes
            from the same TaskService used by the dashboard, forms, guards, and route
            components.
          </p>
        </div>

        <div class="header-actions">
          <a routerLink="/dashboard" class="btn btn-ghost">Dashboard</a>
          <a routerLink="/tasks" class="btn btn-ghost">Tasks Route</a>
        </div>
      </header>

      <section class="concept-card">
        <h2>Source signals → computed signals → templates</h2>
        <p>
          The writable signals in <code>TaskService</code> are the source of truth.
          Computed signals derive counts, selected task state, completion rate, and
          summaries. This page reads those signals directly, so every mutation below
          updates the dashboard, navbar, task detail panel, and this inspector without
          manual synchronization.
        </p>
      </section>

      <section class="metric-grid" aria-label="Signal-derived metrics">
        <article class="metric-card">
          <span>Total</span>
          <strong>{{ taskService.totalCount() }}</strong>
          <small>computed from tasks()</small>
        </article>

        <article class="metric-card">
          <span>In Progress</span>
          <strong>{{ taskService.inProgressCount() }}</strong>
          <small>computed from tasks()</small>
        </article>

        <article class="metric-card">
          <span>Done</span>
          <strong>{{ taskService.doneCount() }}</strong>
          <small>computed from tasks()</small>
        </article>

        <article class="metric-card">
          <span>Completion</span>
          <strong>{{ taskService.completionRate() }}%</strong>
          <small>computed from total + done</small>
        </article>
      </section>

      <section class="inspector-grid">
        <article class="panel">
          <header class="panel__header">
            <div>
              <h2>Writable service signal</h2>
              <p><code>_tasks = signal&lt;Task[]&gt;(...)</code></p>
            </div>
          </header>

          <div class="actions">
            <button type="button" class="btn btn-primary" (click)="cycleFirstTaskStatus()">
              Cycle first task status
            </button>

            <button type="button" class="btn btn-primary" (click)="addDemoTask()">
              Add signal demo task
            </button>

            <button type="button" class="btn btn-ghost" (click)="resetDemo()">
              Reset demo state
            </button>
          </div>

          <div class="task-list">
            @for (task of taskService.tasks(); track task.id) {
              <button
                type="button"
                class="task-row"
                [ngClass]="{ 'task-row--selected': task.id === taskService.selectedTaskId() }"
                (click)="selectTask(task.id)"
              >
                <span>
                  <strong>{{ task.title }}</strong>
                  <small>{{ task.priority }} priority · {{ task.tags.join(', ') }}</small>
                </span>
                <em>{{ task.status }}</em>
              </button>
            }
          </div>
        </article>

        <article class="panel">
          <header class="panel__header">
            <div>
              <h2>Computed selection</h2>
              <p><code>selectedTask = computed(...)</code></p>
            </div>
          </header>

          @if (taskService.selectedTask(); as task) {
            <div class="selected-card">
              <span class="status-pill">{{ task.status }}</span>
              <h3>{{ task.title }}</h3>
              <p>{{ task.description }}</p>
              <dl>
                <div>
                  <dt>Due</dt>
                  <dd>{{ task.dueDate | date:'MMM d, yyyy' }}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{{ task.updatedAt | date:'MMM d, yyyy, h:mm a' }}</dd>
                </div>
              </dl>
            </div>
          } @else {
            <div class="empty-state">
              <p>No task selected. Select a task to show how <code>selectedTask</code> recomputes.</p>
            </div>
          }

          <button type="button" class="btn btn-ghost" (click)="selectNextTask()">
            Select next task
          </button>
        </article>
      </section>

      <section class="inspector-grid">
        <article class="panel">
          <header class="panel__header">
            <div>
              <h2>Component-local signals</h2>
              <p><code>filterText</code>, <code>showOnlyOpen</code>, and <code>filteredSignalRows</code></p>
            </div>
          </header>

          <div class="filter-controls">
            <label>
              Filter architecture rows
              <input
                type="search"
                [value]="filterText()"
                (input)="onFilterInput($event)"
                placeholder="Try: computed, effect, template"
              />
            </label>

            <label class="checkbox-row">
              <input
                type="checkbox"
                [checked]="showOnlyReactive()"
                (change)="toggleReactiveOnly($event)"
              />
              Show only reactive nodes
            </label>
          </div>

          <div class="architecture-table" role="table" aria-label="Signal architecture map">
            <div class="architecture-row architecture-row--head" role="row">
              <span>Layer</span>
              <span>Signal / consumer</span>
              <span>Purpose</span>
            </div>

            @for (row of filteredSignalRows(); track row.name) {
              <div class="architecture-row" role="row">
                <span>{{ row.layer }}</span>
                <strong>{{ row.name }}</strong>
                <span>{{ row.purpose }}</span>
              </div>
            }
          </div>
        </article>

        <article class="panel">
          <header class="panel__header">
            <div>
              <h2>effect() side effect log</h2>
              <p>Writes the latest signal snapshot to localStorage and records the change here.</p>
            </div>
          </header>

          <div class="snapshot-card">
            <h3>Current signal snapshot</h3>
            <pre>{{ taskService.signalSnapshot() | json }}</pre>
          </div>

          <div class="log-list">
            @for (entry of effectLog(); track entry.id) {
              <article class="log-entry">
                <time>{{ entry.time | date:'h:mm:ss a' }}</time>
                <strong>{{ entry.message }}</strong>
                <pre>{{ entry.snapshot | json }}</pre>
              </article>
            }
          </div>
        </article>
      </section>
    </section>
  `,
  styles: [`
    .signals-page {
      padding: 2rem;
      display: grid;
      gap: 1.5rem;
      color: #0f172a;
    }

    .signals-header,
    .concept-card,
    .panel,
    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
    }

    .signals-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.5rem;
    }

    .signals-header h1 {
      margin: 0.25rem 0 0.5rem;
      font-size: 2rem;
    }

    .signals-header p,
    .concept-card p,
    .panel p,
    .metric-card small {
      color: #64748b;
      line-height: 1.6;
    }

    .eyebrow {
      margin: 0;
      color: #2563eb;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.78rem;
    }

    .header-actions,
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .concept-card,
    .panel {
      padding: 1.25rem;
    }

    .concept-card h2,
    .panel h2 {
      margin: 0 0 0.5rem;
    }

    code {
      background: #f1f5f9;
      border-radius: 0.35rem;
      padding: 0.1rem 0.3rem;
    }

    .metric-grid,
    .inspector-grid {
      display: grid;
      gap: 1rem;
    }

    .metric-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .inspector-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .metric-card {
      padding: 1rem;
      display: grid;
      gap: 0.35rem;
    }

    .metric-card span {
      color: #475569;
    }

    .metric-card strong {
      font-size: 2rem;
    }

    .panel__header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .task-list,
    .log-list {
      display: grid;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .task-row {
      width: 100%;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 0.9rem;
      padding: 0.9rem 1rem;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      text-align: left;
      cursor: pointer;
    }

    .task-row--selected {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      background: #eff6ff;
    }

    .task-row small {
      display: block;
      margin-top: 0.25rem;
      color: #64748b;
    }

    .task-row em,
    .status-pill {
      align-self: start;
      border-radius: 999px;
      background: #e0f2fe;
      color: #075985;
      padding: 0.25rem 0.55rem;
      font-style: normal;
      font-weight: 700;
      font-size: 0.78rem;
      white-space: nowrap;
    }

    .selected-card {
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      background: #f8fafc;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .selected-card h3 {
      margin: 0.8rem 0 0.5rem;
    }

    dl {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    dt {
      color: #64748b;
      font-size: 0.82rem;
    }

    dd {
      margin: 0.2rem 0 0;
      font-weight: 700;
    }

    .filter-controls {
      display: grid;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .filter-controls label {
      display: grid;
      gap: 0.4rem;
      font-weight: 700;
    }

    .filter-controls input[type='search'] {
      border: 1px solid #cbd5e1;
      border-radius: 0.75rem;
      padding: 0.75rem 0.9rem;
      font: inherit;
    }

    .checkbox-row {
      display: flex !important;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600 !important;
      color: #334155;
    }

    .architecture-table {
      display: grid;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      overflow: hidden;
    }

    .architecture-row {
      display: grid;
      grid-template-columns: 0.9fr 1.1fr 2fr;
      gap: 0.75rem;
      padding: 0.8rem;
      border-bottom: 1px solid #e2e8f0;
      align-items: center;
    }

    .architecture-row:last-child {
      border-bottom: 0;
    }

    .architecture-row--head {
      background: #f1f5f9;
      font-weight: 800;
    }

    .snapshot-card,
    .log-entry,
    .empty-state {
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      background: #f8fafc;
      padding: 1rem;
    }

    pre {
      white-space: pre-wrap;
      word-break: break-word;
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.9rem;
      overflow: auto;
      font-size: 0.82rem;
    }

    .log-entry time {
      display: block;
      color: #64748b;
      font-size: 0.82rem;
      margin-bottom: 0.25rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 999px;
      padding: 0.7rem 1rem;
      font-weight: 800;
      font: inherit;
      text-decoration: none;
      cursor: pointer;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }

    .btn-ghost {
      background: #eef2f7;
      color: #0f172a;
    }

    @media (max-width: 980px) {
      .signals-header,
      .inspector-grid {
        grid-template-columns: 1fr;
      }

      .signals-header {
        flex-direction: column;
      }

      .metric-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 680px) {
      .signals-page {
        padding: 1rem;
      }

      .metric-grid,
      .architecture-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SignalInspectorComponent {
  readonly taskService = inject(TaskService);
  private readonly notificationService = inject(NotificationService);

  readonly filterText = signal('');
  readonly showOnlyReactive = signal(false);

  private readonly logId = signal(0);
  readonly effectLog = signal<SignalLogEntry[]>([]);

  readonly signalRows = [
    {
      layer: 'Source',
      name: 'TaskService._tasks',
      purpose: 'Writable signal holding the task collection.',
      reactive: true
    },
    {
      layer: 'Source',
      name: 'TaskService._selectedTaskId',
      purpose: 'Writable signal holding the current task selection.',
      reactive: true
    },
    {
      layer: 'Derived',
      name: 'TaskService.selectedTask',
      purpose: 'Computed signal derived from _tasks and _selectedTaskId.',
      reactive: true
    },
    {
      layer: 'Derived',
      name: 'TaskService.completionRate',
      purpose: 'Computed signal derived from totalCount and doneCount.',
      reactive: true
    },
    {
      layer: 'Local UI',
      name: 'SignalInspectorComponent.filterText',
      purpose: 'Component-local writable signal used only by this page.',
      reactive: true
    },
    {
      layer: 'Side Effect',
      name: 'effect()',
      purpose: 'Persists the current signal snapshot to localStorage.',
      reactive: true
    },
    {
      layer: 'Template',
      name: 'NavbarComponent template',
      purpose: 'Reads service computed signals and updates when they change.',
      reactive: true
    },
    {
      layer: 'Plain code',
      name: 'TaskService.updateStatus()',
      purpose: 'Imperative service method that updates the writable task signal.',
      reactive: false
    }
  ];

  readonly filteredSignalRows = computed(() => {
    const query = this.filterText().trim().toLowerCase();
    const reactiveOnly = this.showOnlyReactive();

    return this.signalRows.filter(row => {
      const matchesQuery =
        !query ||
        row.layer.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.purpose.toLowerCase().includes(query);

      const matchesReactive = !reactiveOnly || row.reactive;

      return matchesQuery && matchesReactive;
    });
  });

  constructor() {
    effect(() => {
      const snapshot = this.taskService.signalSnapshot();

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('taskflow-signal-snapshot', JSON.stringify(snapshot));
      }

      const nextId = untracked(() => this.logId()) + 1;
      this.logId.set(nextId);

      this.effectLog.update(entries => [
        {
          id: nextId,
          time: new Date(),
          message: 'Signal graph snapshot changed',
          snapshot
        },
        ...entries
      ].slice(0, 5));
    });
  }

  onFilterInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterText.set(value);
  }

  toggleReactiveOnly(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.showOnlyReactive.set(checked);
  }

  selectTask(taskId: string): void {
    this.taskService.selectTask(taskId);
  }

  selectNextTask(): void {
    this.taskService.selectNextTask();
  }

  cycleFirstTaskStatus(): void {
    this.taskService.cycleFirstTaskStatus();
  }

  addDemoTask(): void {
    this.taskService.addSignalDemoTask();
  }

  resetDemo(): void {
    this.taskService.resetSignalDemoState();
    this.notificationService.info('Signals Lab reset to the Chapter 9 baseline');
  }
}