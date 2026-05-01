import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  inject
} from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective implements OnDestroy {

  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  @Input() appClickOutside = false;
  @Output() clickedOutside = new EventEmitter<void>();

  private removeListener?: () => void;

  ngOnChanges(): void {
    if (this.appClickOutside) {
      this.startListening();
    } else {
      this.removeListener?.();
    }
  }

  private startListening(): void {
    this.removeListener = this.renderer.listen(
      'document',
      'click',
      (event: MouseEvent) => {
        if (!this.appClickOutside) return;

        const clickedInside = this.el.nativeElement.contains(event.target as Node);

        if (!clickedInside) {
          this.clickedOutside.emit();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.removeListener?.();
  }
}