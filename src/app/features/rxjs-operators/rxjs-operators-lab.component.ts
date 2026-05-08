import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  Subject,
  catchError,
  combineLatest,
  concatMap,
  debounceTime,
  delay,
  distinctUntilChanged,
  exhaustMap,
  filter,
  finalize,
  forkJoin,
  from,
  map,
  mergeMap,
  of,
  retry,
  scan,
  shareReplay,
  switchMap,
  tap,
  throwError,
  timer,
  withLatestFrom,
  zip
} from 'rxjs';

type HigherOrderOperator = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';
type ErrorMode = 'unhandled' | 'catchError' | 'retry';
type CombinationMode = 'forkJoin' | 'combineLatest' | 'withLatestFrom' | 'zip';

interface OperatorSummary {
  name: string;
  bestFor: string;
  taskFlowUse: string;
}

@Component({
  selector: 'app-rxjs-operators-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="operators-page">
      <section class="hero">
        <div>
          <p class="eyebrow">Chapter 11</p>
          <h1>RxJS Operators Lab</h1>
          <p>
            Test the operators that matter in production Angular applications:
            higher-order mapping, error recovery, multicasting, stream combination,
            foundational operators, and subscription lifecycle management.
          </p>
        </div>

        <div class="hero-card">
          <span class="hero-card__label">Mental model</span>
          <strong>RxJS models time, concurrency, and async coordination.</strong>
          <small>Signals store the latest state. RxJS decides how values arrive.</small>
        </div>
      </section>

      <section class="operator-grid" aria-label="Higher-order operator summaries">
        @for (item of operatorSummaries; track item.name) {
          <article class="summary-card">
            <h2>{{ item.name }}</h2>
            <p>{{ item.bestFor }}</p>
            <small>{{ item.taskFlowUse }}</small>
          </article>
        }
      </section>

      <section class="lab-grid">
        <article class="panel panel-wide">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Scenario 1</p>
              <h2>Higher-order mapping operators</h2>
            </div>
            <span class="badge">{{ selectedHigherOrderOperator() }}</span>
          </div>

          <p>
            Trigger three rapid task update requests and compare how each operator
            handles an active inner Observable when a new outer value arrives.
          </p>

          <div class="button-row">
            <button type="button" (click)="runHigherOrderDemo('switchMap')">switchMap</button>
            <button type="button" (click)="runHigherOrderDemo('mergeMap')">mergeMap</button>
            <button type="button" (click)="runHigherOrderDemo('concatMap')">concatMap</button>
            <button type="button" (click)="runHigherOrderDemo('exhaustMap')">exhaustMap</button>
          </div>

          <div class="result-strip">
            <span>Started: {{ higherOrderStarted() }}</span>
            <span>Completed: {{ higherOrderCompleted() }}</span>
            <span>Final result: {{ higherOrderResult() || 'None yet' }}</span>
          </div>

          <ol class="event-log">
            @for (event of higherOrderLog(); track $index) {
              <li>{{ event }}</li>
            }
          </ol>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Scenario 2</p>
              <h2>Error handling</h2>
            </div>
            <span class="badge badge-error">{{ errorState() }}</span>
          </div>

          <p>
            Compare an unhandled error, a recovered fallback value, and retry-based
            recovery. This demonstrates why errors must be caught inside inner streams.
          </p>

          <div class="button-row button-row-wrap">
            <button type="button" (click)="runErrorDemo('unhandled')">Unhandled error</button>
            <button type="button" (click)="runErrorDemo('catchError')">catchError fallback</button>
            <button type="button" (click)="runErrorDemo('retry')">retry then success</button>
          </div>

          <ol class="event-log compact">
            @for (event of errorLog(); track $index) {
              <li>{{ event }}</li>
            }
          </ol>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Scenario 3</p>
              <h2>Multicasting and shareReplay</h2>
            </div>
            <span class="badge">HTTP calls: {{ httpCallCount() }}</span>
          </div>

          <p>
            Subscribe twice to a cold request, then repeat with shareReplay(1).
            The shared version reuses the same execution and cached response.
          </p>

          <div class="button-row button-row-wrap">
            <button type="button" (click)="runColdObservableDemo()">Cold observable</button>
            <button type="button" (click)="runShareReplayDemo()">shareReplay demo</button>
            <button type="button" (click)="resetMulticastDemo()">Reset</button>
          </div>

          <ol class="event-log compact">
            @for (event of multicastLog(); track $index) {
              <li>{{ event }}</li>
            }
          </ol>
        </article>

        <article class="panel panel-wide">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Scenario 4</p>
              <h2>Combination operators</h2>
            </div>
            <span class="badge">{{ combinationMode() }}</span>
          </div>

          <p>
            Compare operators that coordinate multiple streams. The key question is:
            what should trigger the combined emission?
          </p>

          <div class="button-row button-row-wrap">
            <button type="button" (click)="runCombinationDemo('forkJoin')">forkJoin</button>
            <button type="button" (click)="runCombinationDemo('combineLatest')">combineLatest</button>
            <button type="button" (click)="runCombinationDemo('withLatestFrom')">withLatestFrom</button>
            <button type="button" (click)="runCombinationDemo('zip')">zip</button>
          </div>

          <ol class="event-log">
            @for (event of combinationLog(); track $index) {
              <li>{{ event }}</li>
            }
          </ol>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Scenario 5</p>
              <h2>Building blocks</h2>
            </div>
            <span class="badge">{{ filteredFoundationRows().length }} rows</span>
          </div>

          <p>
            Type into the filter to observe debounceTime and distinctUntilChanged.
            Use the scan demo to accumulate events into running state.
          </p>

          <label class="field-label" for="foundation-filter">Operator filter</label>
          <input
            id="foundation-filter"
            type="search"
            [value]="foundationQuery()"
            (input)="onFoundationFilter($event)"
            placeholder="Try: map, tap, scan, debounce"
          />

          <div class="button-row button-row-wrap">
            <button type="button" (click)="pushScanEvent()">Push scan event</button>
            <button type="button" (click)="resetFoundationDemo()">Reset</button>
          </div>

          <div class="mini-list">
            @for (row of filteredFoundationRows(); track row.name) {
              <div>
                <strong>{{ row.name }}</strong>
                <span>{{ row.use }}</span>
              </div>
            }
          </div>

          <ol class="event-log compact">
            @for (event of foundationLog(); track $index) {
              <li>{{ event }}</li>
            }
          </ol>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Scenario 6</p>
              <h2>Subscription lifecycle</h2>
            </div>
            <span class="badge">{{ subscriptionState() }}</span>
          </div>

          <p>
            Start a short subscription and watch finalize execute when the stream
            completes. This mirrors the cleanup pattern used with takeUntilDestroyed().
          </p>

          <div class="button-row button-row-wrap">
            <button type="button" (click)="runSubscriptionDemo()">Start lifecycle demo</button>
            <button type="button" (click)="clearSubscriptionLog()">Clear log</button>
          </div>

          <ol class="event-log compact">
            @for (event of subscriptionLog(); track $index) {
              <li>{{ event }}</li>
            }
          </ol>
        </article>
      </section>

      <section class="snapshot-panel">
        <div>
          <p class="eyebrow">Decision summary</p>
          <h2>Which operator should I reach for?</h2>
        </div>

        <div class="decision-grid">
          <div><strong>Latest only</strong><span>switchMap</span></div>
          <div><strong>All in parallel</strong><span>mergeMap</span></div>
          <div><strong>In order</strong><span>concatMap</span></div>
          <div><strong>Ignore duplicates</strong><span>exhaustMap</span></div>
          <div><strong>Recover</strong><span>catchError / retry</span></div>
          <div><strong>Share work</strong><span>shareReplay</span></div>
          <div><strong>Wait for all</strong><span>forkJoin</span></div>
          <div><strong>Stay synchronized</strong><span>combineLatest</span></div>
        </div>

        <pre>{{ snapshot() }}</pre>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: calc(100vh - 64px);
      background: #f8fafc;
      color: #0f172a;
    }

    .operators-page {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px;
    }

    .hero,
    .snapshot-panel,
    .panel,
    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 22px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 24px;
      padding: 30px;
      margin-bottom: 24px;
    }

    .hero h1,
    .panel h2,
    .snapshot-panel h2,
    .summary-card h2 {
      margin: 0;
    }

    .hero h1 {
      font-size: clamp(2rem, 3vw, 3rem);
      line-height: 1.05;
      margin-bottom: 12px;
    }

    .hero p,
    .panel p,
    .summary-card p {
      color: #475569;
      line-height: 1.6;
    }

    .hero-card {
      display: grid;
      gap: 10px;
      align-content: center;
      border-radius: 18px;
      padding: 22px;
      color: #ffffff;
      background: linear-gradient(135deg, #1d4ed8, #7c3aed);
    }

    .hero-card__label,
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      font-weight: 800;
    }

    .eyebrow {
      margin: 0 0 6px;
      color: #2563eb;
    }

    .operator-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card,
    .panel,
    .snapshot-panel {
      padding: 22px;
    }

    .summary-card h2 {
      font-size: 1.1rem;
      color: #1d4ed8;
    }

    .summary-card small,
    .hero-card small {
      color: inherit;
      opacity: 0.85;
      line-height: 1.5;
    }

    .lab-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }

    .panel-wide {
      grid-column: 1 / -1;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 30px;
      padding: 0 12px;
      border-radius: 999px;
      background: #e0ecff;
      color: #1d4ed8;
      font-weight: 800;
      white-space: nowrap;
    }

    .badge-error {
      background: #fee2e2;
      color: #b91c1c;
    }

    .button-row {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 16px 0;
    }

    .button-row-wrap {
      flex-wrap: wrap;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 10px 14px;
      cursor: pointer;
      background: #2563eb;
      color: white;
      font-weight: 800;
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
    }

    button:hover {
      background: #1d4ed8;
    }

    input {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 12px 14px;
      font: inherit;
      margin: 8px 0 10px;
    }

    input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
    }

    .field-label {
      font-weight: 800;
      color: #334155;
    }

    .result-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 10px 0 16px;
    }

    .result-strip span {
      border-radius: 12px;
      background: #f1f5f9;
      padding: 8px 10px;
      color: #334155;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .event-log {
      display: grid;
      gap: 8px;
      max-height: 280px;
      overflow: auto;
      padding: 12px 12px 12px 32px;
      border-radius: 16px;
      background: #0f172a;
      color: #dbeafe;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .event-log.compact {
      max-height: 220px;
    }

    .mini-list {
      display: grid;
      gap: 8px;
      margin: 12px 0;
    }

    .mini-list div {
      display: grid;
      grid-template-columns: 130px minmax(0, 1fr);
      gap: 10px;
      padding: 10px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .mini-list span {
      color: #475569;
    }

    .snapshot-panel {
      margin-top: 22px;
    }

    .decision-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin: 16px 0;
    }

    .decision-grid div {
      display: grid;
      gap: 4px;
      padding: 12px;
      border-radius: 14px;
      background: #f1f5f9;
    }

    .decision-grid span {
      color: #2563eb;
      font-weight: 800;
    }

    pre {
      white-space: pre-wrap;
      overflow: auto;
      border-radius: 16px;
      padding: 16px;
      background: #111827;
      color: #d1fae5;
      font-size: 0.9rem;
    }

    @media (max-width: 980px) {
      .hero,
      .lab-grid,
      .operator-grid,
      .decision-grid {
        grid-template-columns: 1fr;
      }

      .operators-page {
        padding: 20px;
      }
    }
  `]
})
export class RxjsOperatorsLabComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly operatorSummaries: OperatorSummary[] = [
    {
      name: 'switchMap',
      bestFor: 'Cancels stale work when only the latest value matters.',
      taskFlowUse: 'Live search and route-driven data loading.'
    },
    {
      name: 'mergeMap',
      bestFor: 'Runs independent operations concurrently.',
      taskFlowUse: 'Batch updates where all requests should complete.'
    },
    {
      name: 'concatMap',
      bestFor: 'Queues operations and preserves order.',
      taskFlowUse: 'Sequential saves or approval workflows.'
    },
    {
      name: 'exhaustMap',
      bestFor: 'Ignores duplicate triggers while work is active.',
      taskFlowUse: 'Submit buttons and payment-like flows.'
    }
  ];

  readonly selectedHigherOrderOperator = signal<HigherOrderOperator>('switchMap');
  readonly higherOrderLog = signal<string[]>(['Choose an operator to run the rapid-request demo.']);
  readonly higherOrderStarted = signal(0);
  readonly higherOrderCompleted = signal(0);
  readonly higherOrderResult = signal('');

  readonly errorState = signal('idle');
  readonly errorLog = signal<string[]>(['Choose an error strategy to compare stream behavior.']);

  readonly httpCallCount = signal(0);
  readonly multicastLog = signal<string[]>(['Run the cold observable or shareReplay demo.']);

  readonly combinationMode = signal<CombinationMode>('forkJoin');
  readonly combinationLog = signal<string[]>(['Choose a combination operator to see what triggers emissions.']);

  readonly foundationQuery = signal('');
  readonly debouncedFoundationQuery = signal('');
  readonly scanCount = signal(0);
  readonly foundationLog = signal<string[]>(['Type in the filter or push scan events.']);

  readonly subscriptionState = signal('idle');
  readonly subscriptionLog = signal<string[]>(['Start the lifecycle demo to see ticks and finalize().']);

  readonly foundationRows = [
    { name: 'map', use: 'Transforms every value in a stream.' },
    { name: 'filter', use: 'Allows only values that satisfy a condition.' },
    { name: 'tap', use: 'Observes values without changing the stream.' },
    { name: 'scan', use: 'Accumulates streaming state over time.' },
    { name: 'debounceTime', use: 'Waits for quiet time before emitting.' },
    { name: 'distinctUntilChanged', use: 'Skips repeated values.' },
    { name: 'finalize', use: 'Runs cleanup on complete, error, or unsubscribe.' }
  ];

  readonly filteredFoundationRows = computed(() => {
    const query = this.debouncedFoundationQuery().trim().toLowerCase();

    if (!query) {
      return this.foundationRows;
    }

    return this.foundationRows.filter(row =>
      row.name.toLowerCase().includes(query) ||
      row.use.toLowerCase().includes(query)
    );
  });

  readonly snapshot = computed(() => JSON.stringify({
    higherOrder: {
      operator: this.selectedHigherOrderOperator(),
      started: this.higherOrderStarted(),
      completed: this.higherOrderCompleted(),
      result: this.higherOrderResult() || null
    },
    errorHandling: {
      state: this.errorState()
    },
    multicasting: {
      httpCalls: this.httpCallCount()
    },
    combination: {
      mode: this.combinationMode()
    },
    foundations: {
      rawQuery: this.foundationQuery(),
      debouncedQuery: this.debouncedFoundationQuery(),
      scanCount: this.scanCount(),
      visibleRows: this.filteredFoundationRows().length
    },
    subscriptions: {
      state: this.subscriptionState()
    }
  }, null, 2));

  constructor() {
    toObservable(this.foundationQuery).pipe(
      debounceTime(350),
      distinctUntilChanged(),
      tap(query => this.appendFoundationLog(`debounced filter emitted: "${query || 'empty'}"`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => this.debouncedFoundationQuery.set(query));
  }

  runHigherOrderDemo(operator: HigherOrderOperator): void {
    this.selectedHigherOrderOperator.set(operator);
    this.higherOrderLog.set([`Running ${operator} with three rapid outer emissions: A, B, C.`]);
    this.higherOrderStarted.set(0);
    this.higherOrderCompleted.set(0);
    this.higherOrderResult.set('');

    const outer$ = from(['A', 'B', 'C']).pipe(
      concatMap((label, index) => timer(index * 120).pipe(map(() => label)))
    );

    const requestFor = (label: string) => this.simulatedRequest(label);

    const pipeline$ = operator === 'switchMap'
      ? outer$.pipe(switchMap(label => requestFor(label)))
      : operator === 'mergeMap'
        ? outer$.pipe(mergeMap(label => requestFor(label)))
        : operator === 'concatMap'
          ? outer$.pipe(concatMap(label => requestFor(label)))
          : outer$.pipe(exhaustMap(label => requestFor(label)));

    pipeline$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: result => {
        this.higherOrderResult.set(result);
        this.appendHigherOrderLog(`subscriber received: ${result}`);
      },
      complete: () => this.appendHigherOrderLog(`${operator} demo completed.`)
    });
  }

  runErrorDemo(mode: ErrorMode): void {
    this.errorState.set(mode);
    this.errorLog.set([`Running ${mode} scenario.`]);

    if (mode === 'unhandled') {
      this.failingRequest().pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: value => this.appendErrorLog(`next: ${value}`),
        error: error => {
          this.errorState.set('terminated');
          this.appendErrorLog(`unhandled error terminated the stream: ${error.message}`);
        }
      });
      return;
    }

    if (mode === 'catchError') {
      this.failingRequest().pipe(
        catchError(error => {
          this.appendErrorLog(`caught error: ${error.message}`);
          return of('fallback result: []');
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: value => {
          this.errorState.set('recovered');
          this.appendErrorLog(`subscriber received fallback: ${value}`);
        },
        complete: () => this.appendErrorLog('stream completed safely after fallback.')
      });
      return;
    }

    let attempts = 0;
    this.unstableRequest(() => attempts++).pipe(
      retry({ count: 2, delay: 300 }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: value => {
        this.errorState.set('retry-success');
        this.appendErrorLog(`subscriber received after retry: ${value}`);
      },
      error: error => {
        this.errorState.set('retry-failed');
        this.appendErrorLog(`retry failed: ${error.message}`);
      }
    });
  }

  runColdObservableDemo(): void {
    this.resetMulticastDemo();
    const cold$ = this.fakeHttpRequest('cold response');

    cold$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value =>
      this.appendMulticastLog(`Subscriber A received: ${value}`)
    );

    cold$.pipe(delay(100), takeUntilDestroyed(this.destroyRef)).subscribe(value =>
      this.appendMulticastLog(`Subscriber B received: ${value}`)
    );
  }

  runShareReplayDemo(): void {
    this.resetMulticastDemo();
    const shared$ = this.fakeHttpRequest('shared cached response').pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    shared$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value =>
      this.appendMulticastLog(`Subscriber A received: ${value}`)
    );

    timer(500).pipe(
      switchMap(() => shared$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value =>
      this.appendMulticastLog(`Late Subscriber B received cached value: ${value}`)
    );
  }

  resetMulticastDemo(): void {
    this.httpCallCount.set(0);
    this.multicastLog.set(['Multicast demo reset.']);
  }

  runCombinationDemo(mode: CombinationMode): void {
    this.combinationMode.set(mode);
    this.combinationLog.set([`Running ${mode} combination demo.`]);

    if (mode === 'forkJoin') {
      forkJoin({
        tasks: of(['task-1', 'task-2']).pipe(delay(300)),
        projects: of(['project-alpha']).pipe(delay(500)),
        preferences: of({ denseMode: false }).pipe(delay(150))
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
        this.appendCombinationLog(`forkJoin emitted once after all completed: ${JSON.stringify(result)}`);
      });
      return;
    }

    if (mode === 'combineLatest') {
      const tasks$ = new BehaviorSubject('tasks: 3');
      const filter$ = new BehaviorSubject('filter: all');

      combineLatest([tasks$, filter$]).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(([tasks, filterValue]) => {
        this.appendCombinationLog(`combineLatest emission → ${tasks}, ${filterValue}`);
      });

      timer(300).subscribe(() => filter$.next('filter: done'));
      timer(600).subscribe(() => tasks$.next('tasks: 4'));
      timer(900).subscribe(() => {
        tasks$.complete();
        filter$.complete();
      });
      return;
    }

    if (mode === 'withLatestFrom') {
      const selectedTask$ = new Subject<string>();
      const currentUser$ = new BehaviorSubject('user: admin');

      selectedTask$.pipe(
        withLatestFrom(currentUser$),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(([task, user]) => {
        this.appendCombinationLog(`selection event used latest context → ${task}, ${user}`);
      });

      currentUser$.next('user: reviewer');
      timer(250).subscribe(() => selectedTask$.next('task-1'));
      timer(500).subscribe(() => currentUser$.next('user: admin'));
      timer(750).subscribe(() => selectedTask$.next('task-2'));
      timer(950).subscribe(() => {
        selectedTask$.complete();
        currentUser$.complete();
      });
      return;
    }

    zip(
      of('task-A', 'task-B', 'task-C').pipe(concatMap(value => of(value).pipe(delay(200)))),
      of('project-1', 'project-2').pipe(concatMap(value => of(value).pipe(delay(350))))
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([task, project]) => this.appendCombinationLog(`zip paired by index → ${task} with ${project}`),
      complete: () => this.appendCombinationLog('zip completed when the shorter source completed.')
    });
  }

  onFoundationFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.foundationQuery.set(value);
    this.appendFoundationLog(`raw input changed: "${value || 'empty'}"`);
  }

  pushScanEvent(): void {
    from(['task.created']).pipe(
      scan(count => count + 1, this.scanCount()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(count => {
      this.scanCount.set(count);
      this.appendFoundationLog(`scan accumulated event count: ${count}`);
    });
  }

  resetFoundationDemo(): void {
    this.foundationQuery.set('');
    this.debouncedFoundationQuery.set('');
    this.scanCount.set(0);
    this.foundationLog.set(['Foundation demo reset.']);
  }

  runSubscriptionDemo(): void {
    this.subscriptionState.set('active');
    this.subscriptionLog.set(['Subscription started.']);

    timer(0, 400).pipe(
      map(index => index + 1),
      filter(tick => tick <= 3),
      tap(tick => this.appendSubscriptionLog(`tick ${tick}`)),
      finalize(() => {
        this.subscriptionState.set('finalized');
        this.appendSubscriptionLog('finalize() executed — cleanup completed.');
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      complete: () => this.appendSubscriptionLog('subscription completed normally.')
    });
  }

  clearSubscriptionLog(): void {
    this.subscriptionState.set('idle');
    this.subscriptionLog.set(['Subscription log cleared.']);
  }

  private simulatedRequest(label: string) {
    return of(label).pipe(
      tap(() => {
        this.higherOrderStarted.update(value => value + 1);
        this.appendHigherOrderLog(`request ${label} started`);
      }),
      delay(label === 'A' ? 700 : label === 'B' ? 450 : 250),
      map(value => `request ${value} completed`),
      tap(() => this.higherOrderCompleted.update(value => value + 1)),
      finalize(() => this.appendHigherOrderLog(`request ${label} finalized`))
    );
  }

  private failingRequest() {
    return timer(250).pipe(
      switchMap(() => throwError(() => new Error('Simulated HTTP 500')))
    );
  }

  private unstableRequest(incrementAttempt: () => number) {
    return timer(200).pipe(
      switchMap(() => {
        const attempt = incrementAttempt() + 1;
        this.appendErrorLog(`attempt ${attempt}`);

        return attempt < 3
          ? throwError(() => new Error(`Transient failure on attempt ${attempt}`))
          : of('success after retry');
      })
    );
  }

  private fakeHttpRequest(value: string) {
    return timer(350).pipe(
      tap(() => {
        this.httpCallCount.update(count => count + 1);
        this.appendMulticastLog('HTTP execution started');
      }),
      map(() => value)
    );
  }

  private appendHigherOrderLog(message: string): void {
    this.higherOrderLog.update(log => [...log, this.timestamp(message)].slice(-18));
  }

  private appendErrorLog(message: string): void {
    this.errorLog.update(log => [...log, this.timestamp(message)].slice(-14));
  }

  private appendMulticastLog(message: string): void {
    this.multicastLog.update(log => [...log, this.timestamp(message)].slice(-14));
  }

  private appendCombinationLog(message: string): void {
    this.combinationLog.update(log => [...log, this.timestamp(message)].slice(-16));
  }

  private appendFoundationLog(message: string): void {
    this.foundationLog.update(log => [...log, this.timestamp(message)].slice(-14));
  }

  private appendSubscriptionLog(message: string): void {
    this.subscriptionLog.update(log => [...log, this.timestamp(message)].slice(-14));
  }

  private timestamp(message: string): string {
    return `${new Date().toLocaleTimeString()} — ${message}`;
  }
}