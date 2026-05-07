import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TaskRealtimeService } from '../../core/services/task-realtime.service';
import { TaskSearchService } from '../../core/services/task-search.service';
import { TaskService } from '../../core/services/task.service';
import { TaskStatus } from '../../core/models/task.model';

@Component({
  selector: 'app-rxjs-decision-lab',
  standalone: true,
  imports: [JsonPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="rxjs-page">
      <section class="hero-card">
        <div>
          <p class="eyebrow">Chapter 10</p>
          <h1>Signals vs RxJS Decision Lab</h1>
          <p>
            This screen demonstrates the hybrid architecture: signals hold the current application state,
            while RxJS handles debounce, HTTP-style loading, retry, cancellation, and realtime event streams.
          </p>
        </div>

        <div class="hero-actions">
          <a routerLink="/signals" class="btn ghost">Signals Inspector</a>
          <a routerLink="/dashboard" class="btn ghost">Dashboard</a>
        </div>
      </section>

      <section class="decision-grid">
        <article class="panel">
          <p class="eyebrow">Scenario 1</p>
          <h2>Live search: signal → Observable → signal</h2>
          <p>
            The input value is stored as a signal. The query is bridged into RxJS with
            <code>toObservable()</code>, debounced, cancelled with <code>switchMap()</code>,
            then exposed back to the template as a signal.
          </p>

          <label class="field">
            Search tasks
            <input
              type="search"
              placeholder="Try: dashboard, filter, signal"
              [value]="searchService.searchQuery()"
              (input)="onSearchInput($event)"
              (keydown.escape)="searchService.clear()"
            />
          </label>

          <div class="state-line">
            <span>Active: {{ searchService.isSearchActive() ? 'Yes' : 'No' }}</span>
            <span>Searching: {{ searchService.isSearching() ? 'Yes' : 'No' }}</span>
            <span>Results: {{ searchService.resultCount() }}</span>
          </div>

          @if (searchService.searchError()) {
            <p class="error">{{ searchService.searchError() }}</p>
          }

          @if (searchService.isSearchActive()) {
            <div class="result-list">
              @if (searchService.results().length === 0 && !searchService.isSearching()) {
                <p>No matching tasks found.</p>
              }

              @for (task of searchService.results(); track task.id) {
                <button class="task-row" type="button" (click)="taskService.selectTask(task.id)">
                  <strong>{{ task.title }}</strong>
                  <span>{{ task.status }} · {{ task.priority }}</span>
                </button>
              }
            </div>
          }
        </article>

        <article class="panel">
          <p class="eyebrow">Scenario 2</p>
          <h2>HTTP loading with retry and signal state</h2>
          <p>
            <code>HttpTaskService</code> owns the RxJS HTTP-style pipeline.
            <code>TaskService</code> subscribes and writes the latest value into signals.
          </p>

          <div class="button-row">
            <button class="btn primary" type="button" (click)="taskService.loadTasksFromHttp(true)">
              Load tasks via RxJS
            </button>
            <button class="btn ghost" type="button" (click)="simulateHttpFailure()">
              Fail next request once
            </button>
          </div>

          <div class="state-line">
            <span>Loading: {{ taskService.loading() ? 'Yes' : 'No' }}</span>
            <span>HTTP loaded: {{ taskService.httpLoaded() ? 'Yes' : 'No' }}</span>
            <span>Total: {{ taskService.totalCount() }}</span>
          </div>

          @if (taskService.error()) {
            <p class="error">{{ taskService.error() }}</p>
          }
        </article>

        <article class="panel">
          <p class="eyebrow">Scenario 3</p>
          <h2>Realtime stream updates</h2>
          <p>
            A simulated WebSocket stream emits task events over time. RxJS manages the stream;
            the event handler updates service signals so existing UI components react automatically.
          </p>

          <div class="button-row">
            <button class="btn primary" type="button" (click)="realtime.connect()">
              Connect stream
            </button>
            <button class="btn ghost" type="button" (click)="realtime.disconnect()">
              Disconnect
            </button>
          </div>

          <div class="button-row">
            <button class="btn ghost" type="button" (click)="realtime.pushDemoStatusChange()">
              Push status update
            </button>
            <button class="btn ghost" type="button" (click)="realtime.pushDemoCreate()">
              Push created task
            </button>
          </div>

          <div class="state-line">
            <span>Connection: {{ realtime.connectionLabel() }}</span>
            <span>Last event: {{ realtime.lastEvent()?.type ?? 'None' }}</span>
          </div>

          <pre>{{ realtime.lastEvent() | json }}</pre>
        </article>

        <article class="panel">
          <p class="eyebrow">Scenario 4</p>
          <h2>Form submission async state</h2>
          <p>
            Task forms use signals for UI state such as loading and errors, while RxJS controls
            the async request lifecycle with retry, cancellation, and <code>finalize()</code>.
          </p>

          <div class="mini-form">
            <label class="field">
              Demo title
              <input
                type="text"
                [value]="demoTitle()"
                (input)="onDemoTitleInput($event)"
              />
            </label>

            <button
              class="btn primary"
              type="button"
              [disabled]="demoSubmitting() || demoTitle().trim().length < 3"
              (click)="createDemoTask()"
            >
              {{ demoSubmitting() ? 'Submitting...' : 'Submit through RxJS' }}
            </button>
          </div>

          @if (demoSubmitError()) {
            <p class="error">{{ demoSubmitError() }}</p>
          }
        </article>
      </section>

      <section class="panel wide">
        <h2>Decision matrix in the current app</h2>
        <div class="matrix">
          @for (row of decisionRows; track row.problem) {
            <div class="matrix-row">
              <strong>{{ row.problem }}</strong>
              <span>{{ row.tool }}</span>
              <p>{{ row.reason }}</p>
            </div>
          }
        </div>
      </section>

      <section class="panel wide">
        <h2>Current state snapshot</h2>
        <p>This is still read from signals. The mutations above arrive from RxJS workflows.</p>
        <pre>{{ snapshot() | json }}</pre>
      </section>
    </main>
  `,
  styles: [`
    .rxjs-page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero-card,
    .panel {
      border: 1px solid #dbe3ef;
      border-radius: 1.25rem;
      background: #ffffff;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
    }

    .hero-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 1.75rem;
      margin-bottom: 1.5rem;
    }

    h1,
    h2,
    p {
      margin-top: 0;
    }

    .eyebrow {
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
    }

    .hero-actions,
    .button-row,
    .state-line {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .decision-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.25rem;
    }

    .panel {
      padding: 1.5rem;
    }

    .wide {
      margin-top: 1.25rem;
    }

    .field {
      display: grid;
      gap: 0.45rem;
      font-weight: 700;
      margin: 1rem 0;
    }

    input {
      min-height: 2.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.9rem;
      padding: 0 0.9rem;
      font: inherit;
    }

    .btn {
      min-height: 2.5rem;
      border: 0;
      border-radius: 999px;
      padding: 0.55rem 1rem;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn.primary {
      background: #2563eb;
      color: white;
    }

    .btn.ghost {
      background: #eef2f7;
      color: #0f172a;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .state-line {
      margin: 1rem 0;
      color: #334155;
    }

    .state-line span {
      background: #f1f5f9;
      border-radius: 999px;
      padding: 0.35rem 0.7rem;
      font-size: 0.9rem;
    }

    .result-list {
      display: grid;
      gap: 0.6rem;
    }

    .task-row {
      border: 1px solid #dbe3ef;
      border-radius: 0.9rem;
      padding: 0.75rem;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      background: #f8fafc;
      text-align: left;
      cursor: pointer;
    }

    .mini-form {
      display: grid;
      gap: 0.75rem;
    }

    .error {
      color: #b91c1c;
      font-weight: 700;
    }

    pre {
      overflow: auto;
      padding: 1rem;
      border-radius: 0.9rem;
      background: #0f172a;
      color: #dbeafe;
    }

    .matrix {
      display: grid;
      gap: 0.75rem;
    }

    .matrix-row {
      display: grid;
      grid-template-columns: 220px 220px 1fr;
      gap: 1rem;
      border-bottom: 1px solid #e5edf7;
      padding-bottom: 0.75rem;
    }

    .matrix-row p {
      margin: 0;
      color: #475569;
    }

    @media (max-width: 900px) {
      .hero-card,
      .decision-grid,
      .matrix-row {
        grid-template-columns: 1fr;
      }

      .hero-card {
        flex-direction: column;
      }
    }
  `]
})
export class RxjsDecisionLabComponent {
  readonly taskService = inject(TaskService);
  readonly searchService = inject(TaskSearchService);
  readonly realtime = inject(TaskRealtimeService);

  readonly demoTitle = signal('RxJS submission demo task');
  readonly demoSubmitting = signal(false);
  readonly demoSubmitError = signal<string | null>(null);

  readonly snapshot = this.taskService.signalSnapshot;

  readonly decisionRows = [
    {
      problem: 'Dashboard counts',
      tool: 'computed()',
      reason: 'They are synchronous values derived from the current task signal.'
    },
    {
      problem: 'Live search debounce',
      tool: 'toObservable() + RxJS',
      reason: 'Debounce and cancellation are time-based stream operations.'
    },
    {
      problem: 'Search results in template',
      tool: 'toSignal()',
      reason: 'The template needs a current synchronous value to render.'
    },
    {
      problem: 'Realtime task updates',
      tool: 'RxJS stream → signal update',
      reason: 'WebSocket events arrive over time, then update state.'
    },
    {
      problem: 'Form loading state',
      tool: 'signal()',
      reason: 'The UI needs to read a current boolean value immediately.'
    }
  ];

  onSearchInput(event: Event): void {
    this.searchService.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onDemoTitleInput(event: Event): void {
    this.demoTitle.set((event.target as HTMLInputElement).value);
  }

  simulateHttpFailure(): void {
    this.taskService.simulateNextHttpFailure();
    this.taskService.loadTasksFromHttp(true);
  }

  createDemoTask(): void {
    const title = this.demoTitle().trim();

    if (title.length < 3 || this.demoSubmitting()) {
      return;
    }

    this.demoSubmitting.set(true);
    this.demoSubmitError.set(null);

    this.taskService.createTaskRemote({
      title,
      description: 'Created from the Chapter 10 RxJS decision lab.',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date('2026-06-01'),
      tags: ['rxjs', 'submit'],
      assigneeId: 'user-1',
      projectId: 'proj-1'
    }).subscribe({
      next: task => {
        this.demoTitle.set(`RxJS demo task ${this.taskService.totalCount() + 1}`);
        this.taskService.selectTask(task.id);
      },
      error: error => {
        this.demoSubmitError.set(
          error instanceof Error ? error.message : 'Submission failed.'
        );
      },
      complete: () => this.demoSubmitting.set(false)
    });
  }
}