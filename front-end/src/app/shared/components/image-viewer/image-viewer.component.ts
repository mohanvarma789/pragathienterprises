import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageViewerService } from '../../../core/services/image-viewer.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-viewer-modal" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="image-viewer-container">
        <!-- Close Button -->
        <button class="btn-close-viewer" (click)="close()" title="Close (ESC)">
          ✕
        </button>

        <!-- Image Container -->
        <div class="image-display" #imageContainer (wheel)="onImageWheel($event)">
          <img 
            [src]="imageUrl" 
            [alt]="imageName"
            [style.transform]="'scale(' + zoomLevel + ')'"
            class="viewer-image"
          >
        </div>

        <!-- Controls -->
        <div class="viewer-controls">
          <button class="btn-control" (click)="zoomIn()" title="Zoom In (+)">
            🔍+
          </button>
          <button class="btn-control" (click)="zoomOut()" title="Zoom Out (-)">
            🔍-
          </button>
          <button class="btn-control" (click)="resetZoom()" title="Reset Zoom">
            ↺
          </button>
          <button class="btn-control" (click)="toggleFullscreen()" title="Fullscreen (F)">
            ⛶
          </button>
          <button class="btn-control" (click)="downloadImage()" title="Download">
            ⬇
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image-viewer-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .image-viewer-container {
      position: relative;
      width: 90vw;
      height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .btn-close-viewer {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      font-size: 2rem;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      z-index: 10001;
    }

    .btn-close-viewer:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }

    .image-display {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      width: 100%;
      cursor: grab;
    }

    .image-display:active {
      cursor: grabbing;
    }

    .viewer-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.2s ease-out;
      user-select: none;
    }

    .viewer-controls {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50px;
      margin-top: 1rem;
    }

    .btn-control {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      font-size: 1.2rem;
      padding: 0.75rem 1.25rem;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 60px;
    }

    .btn-control:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .btn-close-viewer {
        width: 40px;
        height: 40px;
        font-size: 1.5rem;
        top: 10px;
        right: 10px;
      }

      .viewer-controls {
        flex-wrap: wrap;
        padding: 1rem;
        gap: 0.5rem;
      }

      .btn-control {
        font-size: 1rem;
        padding: 0.5rem 1rem;
        min-width: auto;
      }
    }
  `]
})
export class ImageViewerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isOpen = false;
  imageUrl: string | null = null;
  imageName: string | null = null;
  zoomLevel = 1;

  constructor(private imageViewerService: ImageViewerService) { }

  ngOnInit(): void {
    this.imageViewerService.viewerState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isOpen = state.isOpen;
        this.imageUrl = state.imageUrl;
        this.imageName = state.imageName;
        if (state.isOpen) {
          this.zoomLevel = 1;
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
        this.zoomOut();
        break;
      case '0':
        this.resetZoom();
        break;
      case 'f':
      case 'F':
        this.toggleFullscreen();
        break;
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('image-viewer-modal')) {
      this.close();
    }
  }

  close(): void {
    this.imageViewerService.closeImage();
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + 0.25, 5);
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
  }

  resetZoom(): void {
    this.zoomLevel = 1;
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  downloadImage(): void {
    if (!this.imageUrl) return;

    fetch(this.imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.imageName || 'image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => console.error('Download failed:', err));
  }

  onImageWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY;

    if (delta < 0) {
      // Zoom in
      this.zoomLevel = Math.min(this.zoomLevel + 0.1, 5);
    } else {
      // Zoom out
      this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
    }
  }
}
