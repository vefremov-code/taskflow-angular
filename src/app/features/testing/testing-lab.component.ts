import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface TestMetric {
  label: string;
  value: string;
  tone: 'green' | 'blue' | 'amber' | 'red' | 'slate';
}

type TestScenarioKey =
  | 'signals'
  | 'http-success'
  | 'http-error'
  | 'rxjs-debounce'
  | 'component-dom'
  | 'form-validation'
  | 'guard-redirect'
  | 'integration-flow';

interface ScenarioState {
  key: TestScenarioKey;
  title: string;
  result: string;
  status: 'ready' | 'passing' | 'failing' | 'blocked';
  layer: string;
  assertions: string[];
}

interface TimelineEntry {
  id: number;
  message: string;
}

const DEFAULT_SCENARIO: ScenarioState = {
  key: 'signals',
  title: 'Signal state transition test',
  result: 'Ready: choose a testing scenario to inspect behavior.',
  status: 'ready',
  layer: 'Layer 1 — Pure logic',
  assertions: [
    'Seed TaskService with known task data.',
    'Call updateStatus(taskId, status).',
    'Read the signal and assert the updated state.'
  ]
};

@Component({
  selector: 'app-testing-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="testing-page">
      <section class="hero card">
        <div>
          <p class="eyebrow">Chapter 13</p>
          <h1>Angular Testing Lab</h1>
          <p class="hero__copy">
            Test the behavior that matters: signals, RxJS pipelines, HTTP recovery,
            component rendering, forms, routing guards, and integration flows.
          </p>
        </div>

        <aside class="hero__note">
          <span>Testing principle</span>
          <strong>Verify behavior, not implementation details.</strong>
          <p>Coverage is useful, but meaningful assertions are what catch regressions.</p>
        </aside>
      </section>

      <section class="testing-pyramid card">
        <div class="section-heading">
          <p class="eyebrow">Testing strategy</p>
          <h2>The TaskFlow testing pyramid</h2>
          <p>
            The application architecture determines the right test layer. Most tests should
            be fast, focused, and close to the logic they verify.
          </p>
        </div>

        <div class="pyramid-grid">
          <article class="pyramid-card pyramid-card--logic">
            <span>70%</span>
            <h3>Pure logic tests</h3>
            <p>Services, signals, computed values, validators, and small utilities.</p>
            <code>No DOM. Minimal TestBed.</code>
          </article>

          <article class="pyramid-card pyramid-card--component">
            <span>25%</span>
            <h3>Component tests</h3>
            <p>Inputs, outputs, DOM assertions, user events, and OnPush rendering.</p>
            <code>TestBed + fixture.detectChanges()</code>
          </article>

          <article class="pyramid-card pyramid-card--integration">
            <span>5%</span>
            <h3>Integration tests</h3>
            <p>Routing, guards, HTTP mocks, form submission, and cross-layer flows.</p>
            <code>RouterTestingHarness + HttpTestingController</code>
          </article>
        </div>
      </section>

      <section class="scenario-shell card">
        <div class="section-heading section-heading--row">
          <div>
            <p class="eyebrow">Scenario lab</p>
            <h2>Behavior-first testing scenarios</h2>
            <p>
              Each button models one realistic test case. The result panel shows the layer,
              the assertion style, and the behavior being verified.
            </p>
          </div>

          <button type="button" class="btn btn--ghost" (click)="resetLab()">
            Reset lab
          </button>
        </div>

        <div class="scenario-buttons" aria-label="Testing scenarios">
          <button type="button" class="btn btn--blue" (click)="runScenario('signals')">
            Signals test
          </button>
          <button type="button" class="btn btn--blue" (click)="runScenario('http-success')">
            HTTP success
          </button>
          <button type="button" class="btn btn--red" (click)="runScenario('http-error')">
            HTTP error
          </button>
          <button type="button" class="btn btn--amber" (click)="runScenario('rxjs-debounce')">
            RxJS debounce
          </button>
          <button type="button" class="btn btn--blue" (click)="runScenario('component-dom')">
            Component DOM
          </button>
          <button type="button" class="btn btn--amber" (click)="runScenario('form-validation')">
            Form validation
          </button>
          <button type="button" class="btn btn--red" (click)="runScenario('guard-redirect')">
            Guard redirect
          </button>
          <button type="button" class="btn btn--green" (click)="runScenario('integration-flow')">
            Integration flow
          </button>
        </div>

        <div class="metrics-grid">
          @for (metric of metrics(); track metric.label) {
            <article class="metric" [class]="'metric metric--' + metric.tone">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </article>
          }
        </div>

        <article class="result-panel" [class]="'result-panel result-panel--' + activeScenario().status">
          <div>
            <p class="eyebrow">{{ activeScenario().layer }}</p>
            <h3>{{ activeScenario().title }}</h3>
            <p>{{ activeScenario().result }}</p>
          </div>

          <ul>
            @for (assertion of activeScenario().assertions; track assertion) {
              <li>{{ assertion }}</li>
            }
          </ul>
        </article>
      </section>

      <section class="details-grid">
        <article class="card detail-card">
          <p class="eyebrow">Scenario 1</p>
          <h2>Testing Signals</h2>
          <p>
            Writable signals and computed signals are tested by arranging state,
            applying a mutation, reading the signal, and asserting the new value.
          </p>
          <pre><code>service.updateStatus(taskId, 'done');
expect(service.completedCount()).toBe(1);</code></pre>
        </article>

        <article class="card detail-card">
          <p class="eyebrow">Scenario 2</p>
          <h2>Testing HTTP</h2>
          <p>
            HttpTestingController verifies requests, controls responses, simulates errors,
            and confirms that no unexpected HTTP calls remain open.
          </p>
          <pre><code>const req = httpMock.expectOne('/api/tasks');
req.flush(MOCK_TASKS);
httpMock.verify();</code></pre>
        </article>

        <article class="card detail-card">
          <p class="eyebrow">Scenario 3</p>
          <h2>Testing RxJS timing</h2>
          <p>
            fakeAsync and tick() make debounce, delay, retry, and cancellation behavior
            deterministic instead of relying on real timers.
          </p>
          <pre><code>service.searchQuery.set('design');
tick(350);
expect(httpRequest.params.get('q')).toBe('design');</code></pre>
        </article>

        <article class="card detail-card">
          <p class="eyebrow">Scenario 4</p>
          <h2>Testing components</h2>
          <p>
            Component tests should assert what users see and do: rendered text,
            status badges, form errors, clicks, and emitted events.
          </p>
          <pre><code>fixture.componentRef.setInput('task', task);
fixture.detectChanges();
expect(title.textContent).toContain(task.title);</code></pre>
        </article>
      </section>

      <section class="card comparison-section">
        <div class="section-heading">
          <p class="eyebrow">Testing concern matrix</p>
          <h2>Which testing tool should I reach for?</h2>
        </div>

        <div class="matrix">
          @for (row of matrixRows; track row.concern) {
            <div class="matrix__row">
              <strong>{{ row.concern }}</strong>
              <span>{{ row.tool }}</span>
              <p>{{ row.reason }}</p>
            </div>
          }
        </div>
      </section>

      <section class="summary card">
        <div>
          <p class="eyebrow">Decision summary</p>
          <h2>Tests should mirror architecture</h2>
          <p>
            Signal state is tested directly, RxJS timing is tested with virtual time,
            components are tested through the DOM, and integration tests verify the
            seams between routing, forms, services, and HTTP.
          </p>
        </div>

        <div class="summary__rules">
          <span>Signals → direct state assertions</span>
          <span>RxJS → fakeAsync + tick()</span>
          <span>HTTP → HttpTestingController</span>
          <span>Components → DOM behavior</span>
          <span>Guards → function result or RouterTestingHarness</span>
        </div>
      </section>

      <section class="card timeline-card">
        <div class="section-heading">
          <p class="eyebrow">Test run log</p>
          <h2>Observable testing record</h2>
          <p>Each scenario records the behavior verified by the test.</p>
        </div>

        <div class="timeline" aria-live="polite">
          @for (entry of timeline(); track entry.id) {
            <p>{{ entry.message }}</p>
          }
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: 100vh;
      color: #0f172a;
    }

    .testing-page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 2rem;
      display: grid;
      gap: 1.5rem;
    }

    .card {
      background: #ffffff;
      border: 1px solid #dbe4ee;
      border-radius: 1.25rem;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    }

    .hero {
      display: grid;
      grid-template-columns: 1fr minmax(260px, 360px);
      gap: 2rem;
      align-items: center;
      padding: 2.25rem;
    }

    .hero h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.75rem);
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .hero__copy {
      margin: 1.25rem 0 0;
      max-width: 760px;
      color: #475569;
      line-height: 1.7;
    }

    .hero__note {
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white;
      border-radius: 1rem;
      padding: 1.5rem;
      display: grid;
      gap: 0.5rem;
    }

    .hero__note span,
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.72rem;
      font-weight: 800;
    }

    .hero__note p {
      margin: 0;
      color: rgba(255, 255, 255, 0.82);
      line-height: 1.5;
    }

    .testing-pyramid,
    .scenario-shell,
    .comparison-section,
    .summary,
    .timeline-card {
      padding: 1.5rem;
    }

    .section-heading {
      margin-bottom: 1.25rem;
    }

    .section-heading h2,
    .detail-card h2,
    .summary h2 {
      margin: 0.25rem 0 0.5rem;
      font-size: 1.5rem;
      line-height: 1.15;
    }

    .section-heading p,
    .detail-card p,
    .summary p {
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }

    .section-heading--row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .pyramid-grid,
    .details-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }

    .details-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pyramid-card,
    .detail-card {
      border: 1px solid #dbe4ee;
      border-radius: 1rem;
      padding: 1.25rem;
      background: #f8fafc;
    }

    .pyramid-card span {
      display: inline-flex;
      margin-bottom: 0.75rem;
      padding: 0.35rem 0.65rem;
      border-radius: 999px;
      font-weight: 900;
      font-size: 0.85rem;
    }

    .pyramid-card--logic span { background: #dcfce7; color: #166534; }
    .pyramid-card--component span { background: #dbeafe; color: #1d4ed8; }
    .pyramid-card--integration span { background: #fef3c7; color: #92400e; }

    .pyramid-card h3,
    .detail-card h2 {
      margin: 0 0 0.5rem;
    }

    .pyramid-card p {
      color: #475569;
      line-height: 1.55;
    }

    code {
      font-family: 'Courier New', monospace;
      color: #1e40af;
      font-weight: 700;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      overflow-x: auto;
      margin: 1rem 0 0;
      white-space: pre-wrap;
    }

    pre code {
      color: #e2e8f0;
      font-weight: 600;
    }

    .scenario-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .btn {
      border: 0;
      border-radius: 999px;
      padding: 0.75rem 1rem;
      font-weight: 800;
      cursor: pointer;
      font: inherit;
      box-shadow: 0 10px 24px rgba(37, 99, 235, 0.16);
    }

    .btn--blue { background: #2563eb; color: white; }
    .btn--green { background: #16a34a; color: white; }
    .btn--amber { background: #f59e0b; color: #111827; }
    .btn--red { background: #ef4444; color: white; }
    .btn--ghost { background: #e2e8f0; color: #0f172a; box-shadow: none; }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .metric {
      border: 1px solid #dbe4ee;
      border-radius: 1rem;
      padding: 1rem;
      background: #ffffff;
      min-height: 90px;
    }

    .metric span {
      display: block;
      color: #64748b;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.12em;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }

    .metric strong {
      font-size: 1.55rem;
    }

    .metric--green { border-color: #bbf7d0; background: #f0fdf4; }
    .metric--blue { border-color: #bfdbfe; background: #eff6ff; }
    .metric--amber { border-color: #fde68a; background: #fffbeb; }
    .metric--red { border-color: #fecaca; background: #fef2f2; }
    .metric--slate { border-color: #cbd5e1; background: #f8fafc; }

    .result-panel {
      display: grid;
      grid-template-columns: 1fr minmax(280px, 420px);
      gap: 1rem;
      border-left: 5px solid #2563eb;
      background: #eff6ff;
      border-radius: 1rem;
      padding: 1.25rem;
    }

    .result-panel h3 {
      margin: 0.25rem 0 0.5rem;
      font-size: 1.35rem;
    }

    .result-panel p {
      margin: 0;
      color: #334155;
      line-height: 1.6;
    }

    .result-panel ul {
      margin: 0;
      padding-left: 1.25rem;
      color: #334155;
      line-height: 1.7;
    }

    .result-panel--passing { border-left-color: #16a34a; background: #f0fdf4; }
    .result-panel--failing { border-left-color: #ef4444; background: #fef2f2; }
    .result-panel--blocked { border-left-color: #f59e0b; background: #fffbeb; }
    .result-panel--ready { border-left-color: #2563eb; background: #eff6ff; }

    .matrix {
      display: grid;
      gap: 0.75rem;
    }

    .matrix__row {
      display: grid;
      grid-template-columns: 220px 260px 1fr;
      gap: 1rem;
      align-items: start;
      border-bottom: 1px solid #e2e8f0;
      padding: 0.85rem 0;
    }

    .matrix__row span {
      color: #1d4ed8;
      font-weight: 800;
    }

    .matrix__row p {
      margin: 0;
      color: #475569;
      line-height: 1.5;
    }

    .summary {
      background: #0f172a;
      color: white;
      display: grid;
      grid-template-columns: 1fr minmax(320px, 480px);
      gap: 2rem;
      align-items: center;
    }

    .summary p {
      color: #cbd5e1;
    }

    .summary__rules {
      display: grid;
      gap: 0.75rem;
    }

    .summary__rules span {
      display: block;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      padding: 0.85rem 1rem;
      font-weight: 800;
    }

    .timeline {
      display: grid;
      gap: 0.65rem;
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 1rem;
      padding: 1rem;
      font-family: 'Courier New', monospace;
      min-height: 120px;
    }

    .timeline p {
      margin: 0;
      line-height: 1.5;
    }

    @media (max-width: 900px) {
      .hero,
      .summary,
      .result-panel,
      .pyramid-grid,
      .details-grid,
      .metrics-grid,
      .matrix__row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TestingLabComponent {
  private readonly runCount = signal(0);

  readonly activeScenario = signal<ScenarioState>(DEFAULT_SCENARIO);

  readonly timeline = signal<TimelineEntry[]>([
    {
      id: 1,
      message: 'Ready: select a testing scenario to verify TaskFlow behavior.'
    }
  ]);

  readonly metrics = computed<TestMetric[]>(() => {
    const scenario = this.activeScenario();

    const layerTone: TestMetric['tone'] =
      scenario.layer.includes('Pure') ? 'green'
      : scenario.layer.includes('Component') ? 'blue'
      : scenario.layer.includes('Integration') ? 'amber'
      : 'slate';

    return [
      {
        label: 'Active layer',
        value: scenario.layer.replace('Layer ', ''),
        tone: layerTone
      },
      {
        label: 'Scenario status',
        value: scenario.status,
        tone: scenario.status === 'passing' ? 'green'
          : scenario.status === 'failing' ? 'red'
          : scenario.status === 'blocked' ? 'amber'
          : 'blue'
      },
      {
        label: 'Assertions',
        value: String(scenario.assertions.length),
        tone: 'blue'
      },
      {
        label: 'Runs recorded',
        value: String(this.runCount()),
        tone: 'slate'
      }
    ];
  });

  readonly matrixRows = [
    {
      concern: 'Signal state transitions',
      tool: 'TestBed.inject() + signal reads',
      reason: 'State changes can be tested directly without rendering the DOM.'
    },
    {
      concern: 'HTTP requests',
      tool: 'HttpTestingController',
      reason: 'Tests control success, error, retry, and rollback responses deterministically.'
    },
    {
      concern: 'Debounced RxJS pipelines',
      tool: 'fakeAsync() + tick()',
      reason: 'Virtual time eliminates flaky tests caused by real timers.'
    },
    {
      concern: 'Component rendering',
      tool: 'TestBed + DOM assertions',
      reason: 'The test verifies what the user actually sees and interacts with.'
    },
    {
      concern: 'Routing guards',
      tool: 'Guard function or RouterTestingHarness',
      reason: 'Use direct function tests for logic and harness tests for route wiring.'
    }
  ];

  runScenario(key: TestScenarioKey): void {
    const scenario = this.createScenario(key);
    this.activeScenario.set(scenario);
    this.runCount.update(value => value + 1);
    this.addTimeline(`${scenario.title}: ${scenario.result}`);
  }

  resetLab(): void {
    this.activeScenario.set(DEFAULT_SCENARIO);
    this.runCount.set(0);
    this.timeline.set([
      {
        id: 1,
        message: 'Reset: testing lab returned to the behavior-first baseline.'
      }
    ]);
  }

  private createScenario(key: TestScenarioKey): ScenarioState {
    switch (key) {
      case 'signals':
        return {
          key,
          title: 'Signal state transition test',
          result: 'Passing: service mutation updated the writable signal and recomputed derived values.',
          status: 'passing',
          layer: 'Layer 1 — Pure logic',
          assertions: [
            'TaskService is seeded with known mock tasks.',
            'updateStatus() replaces the affected task immutably.',
            'completedCount() recomputes from the updated tasks signal.'
          ]
        };

      case 'http-success':
        return {
          key,
          title: 'HTTP success test',
          result: 'Passing: mock API response updated signal state and no unexpected requests remained.',
          status: 'passing',
          layer: 'Layer 2 — HTTP service',
          assertions: [
            'HttpTestingController expects one GET /api/tasks request.',
            'req.flush(mockTasks) simulates a successful backend response.',
            'httpMock.verify() confirms the test did not leave open requests.'
          ]
        };

      case 'http-error':
        return {
          key,
          title: 'HTTP error recovery test',
          result: 'Passing: simulated 500 error produced an error state without corrupting existing tasks.',
          status: 'passing',
          layer: 'Layer 2 — HTTP service',
          assertions: [
            'The request fails with a controlled 500 response.',
            'The service exposes an error signal for the UI.',
            'Existing task state remains stable or rolls back correctly.'
          ]
        };

      case 'rxjs-debounce':
        return {
          key,
          title: 'RxJS debounce and cancellation test',
          result: 'Passing: fakeAsync advanced virtual time and verified that only the latest query produced results.',
          status: 'passing',
          layer: 'Layer 3 — RxJS pipeline',
          assertions: [
            'Before tick(350), no HTTP request is expected.',
            'After tick(350), the latest search request is emitted.',
            'Older switchMap requests are ignored when a newer query arrives.'
          ]
        };

      case 'component-dom':
        return {
          key,
          title: 'Component DOM behavior test',
          result: 'Passing: component input rendered expected title, badge, and action behavior in the DOM.',
          status: 'passing',
          layer: 'Layer 4 — Component test',
          assertions: [
            'fixture.componentRef.setInput() provides signal input data.',
            'fixture.detectChanges() renders the updated DOM.',
            'DOM queries assert user-visible output instead of internal computed values.'
          ]
        };

      case 'form-validation':
        return {
          key,
          title: 'Reactive form validation test',
          result: 'Passing: invalid form state disabled submission and displayed the expected validation message.',
          status: 'passing',
          layer: 'Layer 4 — Component test',
          assertions: [
            'Empty required title keeps the submit button disabled.',
            'Touched invalid controls display accessible error messages.',
            'Critical priority requires a due date before submission is valid.'
          ]
        };

      case 'guard-redirect':
        return {
          key,
          title: 'Routing guard redirect test',
          result: 'Passing: unauthenticated navigation returned a UrlTree instead of activating the protected route.',
          status: 'passing',
          layer: 'Layer 5 — Routing guard',
          assertions: [
            'Authenticated user receives true from the guard.',
            'Unauthenticated user receives a UrlTree redirect.',
            'Return URL is preserved for post-login navigation.'
          ]
        };

      case 'integration-flow':
        return {
          key,
          title: 'Task creation integration flow',
          result: 'Passing: form submission, HTTP mock, service update, and navigation work together.',
          status: 'passing',
          layer: 'Layer 5 — Integration test',
          assertions: [
            'The form is filled through DOM input events.',
            'The HTTP request is flushed with a created task response.',
            'The router navigates to the new task detail page.'
          ]
        };
    }
  }

  private addTimeline(message: string): void {
    const id = this.timeline().length + 1;
    this.timeline.update(entries => [
      {
        id,
        message: `${id}. ${message}`
      },
      ...entries
    ].slice(0, 6));
  }
}