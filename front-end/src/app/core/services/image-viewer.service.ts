import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ImageViewerState {
    isOpen: boolean;
    imageUrl: string | null;
    imageName: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class ImageViewerService {
    private viewerState = new BehaviorSubject<ImageViewerState>({
        isOpen: false,
        imageUrl: null,
        imageName: null
    });

    viewerState$ = this.viewerState.asObservable();

    openImage(imageUrl: string, imageName?: string): void {
        this.viewerState.next({
            isOpen: true,
            imageUrl,
            imageName: imageName || 'image'
        });
    }

    closeImage(): void {
        this.viewerState.next({
            isOpen: false,
            imageUrl: null,
            imageName: null
        });
    }
}
