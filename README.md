
# TaskFlow Angular App

A modern Angular 17+ application built step-by-step with a focus on clean architecture, scalability, and best practices.

This project follows a structured learning approach, evolving from a simple dashboard into a component-based Angular application.

---

## 🚀 Features

- Component-based architecture
- Smart vs Presentational components
- Angular Signals for state management
- Standalone components (no NgModules)
- Clean separation of concerns
- Reusable UI components

---

## 📚 Progress

- ✅ Chapter 1 — Initial setup and dashboard
- ✅ Chapter 2 — Component decomposition (TaskCard, StatusBadge)

---

## 🧱 Architecture

The application follows a clear separation of responsibilities:

- **DashboardComponent**
  - Acts as a smart container
  - Manages application state
  - Computes summary statistics
  - Handles navigation and events

- **TaskCardComponent**
  - Reusable presentational component
  - Displays task details
  - Emits user actions (view, mark done)

- **StatusBadgeComponent**
  - Small reusable UI component
  - Handles status display and styling
  - Fully independent and reusable

---

## 📸 Screenshot

> Add your screenshot to `docs/dashboard.png`

```text
docs/dashboard.png











# Taskflow

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
