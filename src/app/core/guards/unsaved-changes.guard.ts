import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component: HasUnsavedChanges
) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return confirm('You have unsaved changes. Leave without saving?');
};