import { Directive, HostListener, Input, ElementRef, Renderer2 } from '@angular/core';
import { ImageViewerService } from '../../core/services/image-viewer.service';

@Directive({
    selector: '[appClickableImage]',
    standalone: true
})
export class ClickableImageDirective {
    @Input() imageName?: string;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        private imageViewerService: ImageViewerService
    ) {
        // Add visual cues
        this.renderer.setStyle(this.el.nativeElement, 'cursor', 'pointer');
        this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.2s, box-shadow 0.2s');
    }

    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1.05)');
        this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 4px 12px rgba(0,0,0,0.2)');
    }

    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1)');
        this.renderer.setStyle(this.el.nativeElement, 'box-shadow', 'none');
    }

    @HostListener('click')
    onClick(): void {
        const imageUrl = this.el.nativeElement.src;
        if (imageUrl) {
            this.imageViewerService.openImage(imageUrl, this.imageName);
        }
    }
}
