import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  skip,
  switchMap,
  tap
} from 'rxjs';

import { Task } from '../models/task.model';
import { HttpTaskService } from './http-task.service';

@Injectable({
  providedIn: 'root'
})
export class TaskSearchService {
  private readonly httpTaskService = inject(HttpTaskService);

  readonly searchQuery = signal('');
  readonly lastCompletedQuery = signal('');
  readonly isSearching = signal(false);
  readonly searchError = signal<string | null>(null);

  private readonly searchResults$ = toObservable(this.searchQuery).pipe(
    map(query => query.trim()),
    distinctUntilChanged(),
    skip(1),
    debounceTime(350),
    tap(query => {
      this.searchError.set(null);
      this.isSearching.set(query.length >= 2);
    }),
    switchMap(query => {
      if (query.length < 2) {
        this.lastCompletedQuery.set(query);
        this.isSearching.set(false);
        return of([] as Task[]);
      }

      return this.httpTaskService.searchTasks(query).pipe(
        tap(() => this.lastCompletedQuery.set(query)),
        catchError(error => {
          this.searchError.set(
            error instanceof Error ? error.message : 'Search failed.'
          );
          return of([] as Task[]);
        }),
        finalize(() => this.isSearching.set(false))
      );
    })
  );

  readonly results = toSignal(this.searchResults$, { initialValue: [] as Task[] });

  readonly isSearchActive = computed(() =>
    this.searchQuery().trim().length >= 2
  );

  readonly resultCount = computed(() => this.results().length);

  clear(): void {
    this.searchQuery.set('');
    this.lastCompletedQuery.set('');
    this.searchError.set(null);
    this.isSearching.set(false);
  }
}