import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface PipelineStep {
  readonly name: string;
  readonly command: string;
  readonly status: 'completed' | 'active' | 'pending';
  readonly description: string;
}

interface DeploymentCheck {
  readonly label: string;
  readonly expected: string;
  readonly status: 'pass' | 'warning' | 'pending';
}

interface BundleChunk {
  readonly name: string;
  readonly sizeKb: number;
  readonly budgetKb: number;
  readonly type: 'initial' | 'lazy' | 'asset';
}

@Component({
  selector: 'app-deployment-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="deployment-page">
      <section class="hero">
        <div>
          <p class="eyebrow">Chapter 17 · Deployment and CI/CD</p>
          <h1>Production Delivery Architecture</h1>
          <p class="hero__copy">
            TaskFlow is now evaluated as a production Angular application: optimized build output,
            runtime configuration, Dockerized static hosting, CI/CD automation, bundle budgets,
            caching rules, and monitoring readiness.
          </p>
        </div>

        <aside class="score-card">
          <span>Deployment Readiness</span>
          <strong>{{ readinessScore() }}/100</strong>
          <small>{{ readinessLabel() }}</small>
        </aside>
      </section>

      <section class="cards cards--four" aria-label="Production deployment summary">
        <article class="metric-card">
          <span>Build Mode</span>
          <strong>production</strong>
          <small>AOT · tree shaking · minification</small>
        </article>

        <article class="metric-card">
          <span>Hosting</span>
          <strong>Nginx SPA</strong>
          <small>index.html fallback enabled</small>
        </article>

        <article class="metric-card">
          <span>Container</span>
          <strong>multi-stage</strong>
          <small>Node builder → Nginx runtime</small>
        </article>

        <article class="metric-card">
          <span>CI/CD</span>
          <strong>GitHub Actions</strong>
          <small>lint → test → build → deploy</small>
        </article>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Build pipeline</p>
            <h2>Production build and CI/CD workflow</h2>
          </div>
          <button type="button" class="ghost-button" (click)="advancePipeline()">
            Advance pipeline step
          </button>
        </div>

        <div class="pipeline" aria-label="CI/CD pipeline visualization">
          @for (step of pipelineSteps(); track step.name; let index = $index) {
            <article class="pipeline__step" [class.pipeline__step--active]="step.status === 'active'" [class.pipeline__step--done]="step.status === 'completed'">
              <span class="pipeline__index">{{ index + 1 }}</span>
              <div>
                <h3>{{ step.name }}</h3>
                <code>{{ step.command }}</code>
                <p>{{ step.description }}</p>
              </div>
            </article>
          }
        </div>
      </section>

      <section class="grid grid--two">
        <article class="panel">
          <p class="eyebrow">Environment strategy</p>
          <h2>Build-time vs runtime configuration</h2>
          <p>
            Build-time configuration uses Angular file replacements. Runtime configuration uses
            <code>config.json</code> loaded before the app starts, allowing the same Docker image to run
            in staging and production.
          </p>

          <div class="comparison">
            <div>
              <h3>Build-time</h3>
              <ul>
                <li><code>environment.ts</code> replacement</li>
                <li>Separate build per environment</li>
                <li>Tree-shakeable feature flags</li>
              </ul>
            </div>
            <div>
              <h3>Runtime</h3>
              <ul>
                <li><code>public/config.json</code></li>
                <li>Same image, different config</li>
                <li>Kubernetes ConfigMap friendly</li>
              </ul>
            </div>
          </div>
        </article>

        <article class="panel">
          <p class="eyebrow">SPA hosting</p>
          <h2>Nginx routing and caching strategy</h2>
          <div class="nginx-rules">
            <div>
              <strong>Deep links</strong>
              <span><code>try_files $uri $uri/ /index.html;</code></span>
            </div>
            <div>
              <strong>Hashed assets</strong>
              <span><code>Cache-Control: immutable</code></span>
            </div>
            <div>
              <strong>index.html</strong>
              <span><code>no-cache, no-store</code></span>
            </div>
            <div>
              <strong>config.json</strong>
              <span><code>no-cache</code></span>
            </div>
          </div>
        </article>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Bundle analysis</p>
            <h2>Production chunk budget inspection</h2>
          </div>
          <button type="button" class="ghost-button" (click)="toggleBundleMode()">
            Toggle simulated regression
          </button>
        </div>

        <div class="bundle-grid">
          @for (chunk of bundleChunks(); track chunk.name) {
            <article class="bundle-card" [class.bundle-card--warning]="chunk.sizeKb > chunk.budgetKb">
              <div class="bundle-card__header">
                <h3>{{ chunk.name }}</h3>
                <span>{{ chunk.type }}</span>
              </div>
              <strong>{{ chunk.sizeKb }} KB</strong>
              <div class="bar" aria-hidden="true">
                <span [style.width.%]="bundleWidth(chunk)"></span>
              </div>
              <small>Budget: {{ chunk.budgetKb }} KB</small>
              @if (chunk.sizeKb > chunk.budgetKb) {
                <p class="warning">Budget warning: investigate eager imports or heavy dependencies.</p>
              }
            </article>
          }
        </div>
      </section>

      <section class="grid grid--two">
        <article class="panel">
          <p class="eyebrow">Docker architecture</p>
          <h2>Multi-stage container build</h2>
          <ol class="numbered-list">
            <li><strong>Node builder:</strong> installs dependencies and runs production Angular build.</li>
            <li><strong>Nginx runtime:</strong> serves only static build artifacts.</li>
            <li><strong>Non-root user:</strong> reduces container privilege exposure.</li>
            <li><strong>Runtime config:</strong> config.json can be mounted per environment.</li>
          </ol>
        </article>

        <article class="panel">
          <p class="eyebrow">Monitoring</p>
          <h2>Production observability readiness</h2>
          <ul class="check-list">
            <li>Sentry ErrorHandler integration for unhandled browser errors</li>
            <li>Release tracking tied to Git SHA</li>
            <li>Action breadcrumbs for task workflow debugging</li>
            <li>Core Web Vitals monitoring for production UX</li>
          </ul>
        </article>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Verification checklist</p>
            <h2>Post-deployment production checks</h2>
          </div>
          <button type="button" class="ghost-button" (click)="toggleVerificationMode()">
            Simulate routing issue
          </button>
        </div>

        <div class="verification-grid">
          @for (check of deploymentChecks(); track check.label) {
            <article class="verification-card" [class.verification-card--warning]="check.status === 'warning'">
              <strong>{{ check.label }}</strong>
              <span>{{ check.expected }}</span>
              <em>{{ check.status }}</em>
            </article>
          }
        </div>
      </section>

      <section class="panel panel--dark">
        <p class="eyebrow">Deployment snapshot</p>
        <h2>Current production-readiness model</h2>
        <pre>{{ deploymentSnapshot() }}</pre>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      background: #f5f7fb;
      min-height: 100vh;
      color: #111827;
    }

    .deployment-page {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero,
    .panel,
    .metric-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 260px;
      gap: 2rem;
      align-items: center;
      padding: 2rem;
      margin-bottom: 1.5rem;
    }

    .eyebrow {
      margin: 0 0 0.5rem;
      color: #2563eb;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    h1,
    h2,
    h3,
    p {
      margin-top: 0;
    }

    h1 {
      margin-bottom: 0.75rem;
      font-size: clamp(2rem, 4vw, 3.5rem);
      line-height: 1.05;
    }

    h2 {
      margin-bottom: 1rem;
      font-size: 1.35rem;
    }

    h3 {
      margin-bottom: 0.4rem;
      font-size: 1rem;
    }

    .hero__copy {
      max-width: 820px;
      color: #4b5563;
      font-size: 1.05rem;
      line-height: 1.7;
    }

    .score-card {
      padding: 1.5rem;
      border-radius: 24px;
      background: linear-gradient(135deg, #111827, #1d4ed8);
      color: white;
    }

    .score-card span,
    .metric-card span {
      display: block;
      color: inherit;
      opacity: 0.8;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .score-card strong {
      display: block;
      margin: 0.75rem 0;
      font-size: 3rem;
      line-height: 1;
    }

    .score-card small,
    .metric-card small {
      color: inherit;
      opacity: 0.8;
    }

    .cards,
    .grid,
    .bundle-grid,
    .verification-grid {
      display: grid;
      gap: 1rem;
    }

    .cards--four {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-bottom: 1.5rem;
    }

    .metric-card,
    .panel {
      padding: 1.5rem;
    }

    .metric-card strong {
      display: block;
      margin: 0.75rem 0 0.35rem;
      font-size: 1.45rem;
    }

    .panel {
      margin-bottom: 1.5rem;
    }

    .grid--two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-bottom: 1.5rem;
    }

    .section-heading {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
      margin-bottom: 1rem;
    }

    .ghost-button {
      border: 1px solid #c7d2fe;
      border-radius: 999px;
      padding: 0.65rem 1rem;
      background: #eef2ff;
      color: #3730a3;
      font-weight: 800;
      cursor: pointer;
    }

    .pipeline {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.9rem;
    }

    .pipeline__step,
    .bundle-card,
    .verification-card,
    .comparison > div,
    .nginx-rules > div {
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      background: #f9fafb;
      padding: 1rem;
    }

    .pipeline__step--done {
      background: #ecfdf5;
      border-color: #86efac;
    }

    .pipeline__step--active {
      background: #eff6ff;
      border-color: #93c5fd;
      outline: 3px solid rgba(37, 99, 235, 0.12);
    }

    .pipeline__index {
      display: inline-flex;
      width: 2rem;
      height: 2rem;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
      border-radius: 999px;
      background: #111827;
      color: #ffffff;
      font-weight: 800;
    }

    code {
      color: #1d4ed8;
      font-weight: 700;
    }

    .comparison {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .comparison ul,
    .check-list,
    .numbered-list {
      margin-bottom: 0;
      padding-left: 1.25rem;
      color: #4b5563;
      line-height: 1.7;
    }

    .nginx-rules {
      display: grid;
      gap: 0.75rem;
    }

    .nginx-rules > div {
      display: grid;
      gap: 0.25rem;
    }

    .bundle-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .bundle-card--warning {
      background: #fffbeb;
      border-color: #f59e0b;
    }

    .bundle-card__header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
    }

    .bundle-card__header span {
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      background: #e0e7ff;
      color: #3730a3;
      font-size: 0.75rem;
      font-weight: 800;
    }

    .bundle-card strong {
      display: block;
      margin: 0.7rem 0;
      font-size: 1.6rem;
    }

    .bar {
      height: 0.55rem;
      overflow: hidden;
      border-radius: 999px;
      background: #e5e7eb;
      margin-bottom: 0.5rem;
    }

    .bar span {
      display: block;
      height: 100%;
      max-width: 100%;
      border-radius: inherit;
      background: #2563eb;
    }

    .warning {
      margin: 0.75rem 0 0;
      color: #92400e;
      font-weight: 700;
    }

    .verification-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .verification-card {
      display: grid;
      gap: 0.35rem;
    }

    .verification-card em {
      justify-self: start;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
      font-style: normal;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.72rem;
    }

    .verification-card--warning {
      background: #fffbeb;
      border-color: #f59e0b;
    }

    .verification-card--warning em {
      background: #fef3c7;
      color: #92400e;
    }

    .panel--dark {
      background: #0f172a;
      color: #e5e7eb;
    }

    pre {
      overflow: auto;
      margin: 0;
      padding: 1rem;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.08);
      color: #dbeafe;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    @media (max-width: 1050px) {
      .hero,
      .grid--two,
      .cards--four,
      .pipeline,
      .bundle-grid,
      .verification-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DeploymentLabComponent {
  private readonly pipelineIndex = signal(2);
  private readonly simulateBundleRegression = signal(false);
  private readonly simulateRoutingIssue = signal(false);

  readonly pipelineSteps = computed<PipelineStep[]>(() => {
    const activeIndex = this.pipelineIndex();

    const steps: Omit<PipelineStep, 'status'>[] = [
      {
        name: 'Lint',
        command: 'npm run lint',
        description: 'Validates static code quality before build artifacts are produced.'
      },
      {
        name: 'Unit Tests',
        command: 'npm run test:ci',
        description: 'Runs the automated Angular test suite in headless browser mode.'
      },
      {
        name: 'Production Build',
        command: 'npm run build:prod',
        description: 'Creates optimized AOT, minified, tree-shaken production assets.'
      },
      {
        name: 'Docker Image',
        command: 'docker build -t taskflow',
        description: 'Packages compiled assets into a small Nginx runtime image.'
      },
      {
        name: 'Deploy',
        command: 'kubectl rollout status',
        description: 'Rolls the release through staging and production verification.'
      }
    ];

    return steps.map((step, index) => ({
      ...step,
      status: index < activeIndex ? 'completed' : index === activeIndex ? 'active' : 'pending'
    }));
  });

  readonly bundleChunks = computed<BundleChunk[]>(() => {
    const regression = this.simulateBundleRegression();

    return [
      {
        name: 'main',
        sizeKb: regression ? 620 : 348,
        budgetKb: 500,
        type: 'initial'
      },
      {
        name: 'styles',
        sizeKb: 86,
        budgetKb: 150,
        type: 'initial'
      },
      {
        name: 'security route',
        sizeKb: 74,
        budgetKb: 180,
        type: 'lazy'
      },
      {
        name: 'deployment route',
        sizeKb: 92,
        budgetKb: 180,
        type: 'lazy'
      }
    ];
  });

  readonly deploymentChecks = computed<DeploymentCheck[]>(() => {
    const routingIssue = this.simulateRoutingIssue();

    return [
      {
        label: 'Deep-link routing',
        expected: routingIssue ? '/tasks/123 returns 404' : '/tasks/123 returns index.html',
        status: routingIssue ? 'warning' : 'pass'
      },
      {
        label: 'Production API URL',
        expected: 'config.json points to production API',
        status: 'pass'
      },
      {
        label: 'Authentication flow',
        expected: 'login, refresh, logout verified',
        status: 'pass'
      },
      {
        label: 'Lazy chunks',
        expected: 'feature routes load on demand',
        status: 'pass'
      },
      {
        label: 'Asset caching',
        expected: 'hashed files immutable; index no-cache',
        status: 'pass'
      },
      {
        label: 'Monitoring',
        expected: 'Sentry release and Web Vitals enabled',
        status: 'pass'
      }
    ];
  });

  readonly readinessScore = computed(() => {
    const bundlePenalty = this.bundleChunks().some(chunk => chunk.sizeKb > chunk.budgetKb) ? 15 : 0;
    const routingPenalty = this.deploymentChecks().some(check => check.status === 'warning') ? 25 : 0;
    return 96 - bundlePenalty - routingPenalty;
  });

  readonly readinessLabel = computed(() => {
    const score = this.readinessScore();
    if (score >= 90) return 'Production-ready model';
    if (score >= 75) return 'Review warnings before release';
    return 'Deployment blocked';
  });

  readonly deploymentSnapshot = computed(() => JSON.stringify({
    build: {
      configuration: 'production',
      optimizations: ['AOT', 'tree-shaking', 'minification', 'code-splitting'],
      budgetsPassing: !this.bundleChunks().some(chunk => chunk.sizeKb > chunk.budgetKb)
    },
    hosting: {
      server: 'Nginx',
      spaFallback: !this.simulateRoutingIssue(),
      hashedAssets: 'immutable cache',
      indexHtml: 'no-cache'
    },
    delivery: {
      pipeline: ['lint', 'test', 'build', 'docker', 'staging', 'production approval'],
      container: 'multi-stage Node builder + Nginx runtime',
      rollout: 'zero-downtime rolling update'
    },
    observability: {
      browserErrors: 'Sentry ErrorHandler',
      performance: 'Core Web Vitals',
      releaseTracking: 'git SHA'
    }
  }, null, 2));

  advancePipeline(): void {
    this.pipelineIndex.update(index => index >= 4 ? 0 : index + 1);
  }

  toggleBundleMode(): void {
    this.simulateBundleRegression.update(value => !value);
  }

  toggleVerificationMode(): void {
    this.simulateRoutingIssue.update(value => !value);
  }

  bundleWidth(chunk: BundleChunk): number {
    return Math.min(100, Math.round((chunk.sizeKb / chunk.budgetKb) * 100));
  }
}