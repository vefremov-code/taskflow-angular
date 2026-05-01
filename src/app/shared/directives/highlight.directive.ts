import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
  inject
} from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective implements OnChanges {
  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  @Input('appHighlight') term = '';
  @Input() highlightText = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['term'] || changes['highlightText']) {
      this.applyHighlight();
    }
  }

  private applyHighlight(): void {
    const host = this.el.nativeElement;
    const text = this.highlightText;
    const search = this.term.trim();

    this.clearContent(host);

    if (!search || !text) {
      this.appendText(host, text);
      return;
    }

    const regex = new RegExp(`(${this.escapeRegex(search)})`, 'gi');
    const parts = text.split(regex);

    for (const part of parts) {
      if (!part) continue;

      if (part.toLowerCase() === search.toLowerCase()) {
        const mark = this.renderer.createElement('mark');
        this.renderer.addClass(mark, 'highlight-match');
        this.renderer.appendChild(mark, this.renderer.createText(part));
        this.renderer.appendChild(host, mark);
      } else {
        this.appendText(host, part);
      }
    }
  }

  private clearContent(host: HTMLElement): void {
    while (host.firstChild) {
      this.renderer.removeChild(host, host.firstChild);
    }
  }

  private appendText(host: HTMLElement, text: string): void {
    this.renderer.appendChild(host, this.renderer.createText(text));
  }

  private escapeRegex(term: string): string {
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}