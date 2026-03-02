import { Component, signal, HostListener, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ImageViewerComponent } from './shared/components/image-viewer/image-viewer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSpinnerModule, ImageViewerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('painting-app');
  private zoomLevel = 1;
  private lastTouchDistance = 0;

  @ViewChild('zoomWrapper') zoomWrapper!: ElementRef<HTMLDivElement>;

  constructor(private themeService: ThemeService) {
    // Theme service initializes automatically in its constructor
  }

  ngOnInit(): void {
    // Initialize zoom
    this.applyZoom();
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY;

      if (delta < 0) {
        // Zoom in
        this.zoomLevel = Math.min(this.zoomLevel + 0.1, 3);
      } else {
        // Zoom out
        this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
      }

      this.applyZoom();
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.lastTouchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2) {
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (this.lastTouchDistance > 0) {
        const scale = currentDistance / this.lastTouchDistance;
        this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel * scale));
        this.applyZoom();
      }

      this.lastTouchDistance = currentDistance;
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length < 2) {
      this.lastTouchDistance = 0;
    }
  }

  private applyZoom(): void {
    if (this.zoomWrapper) {
      const el = this.zoomWrapper.nativeElement;
      el.style.transform = `scale(${this.zoomLevel})`;
      el.style.transformOrigin = 'top left';
      el.style.width = `${100 / this.zoomLevel}%`;
      el.style.height = `${100 / this.zoomLevel}%`;

      // Ensure body doesn't have transform
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }
}
