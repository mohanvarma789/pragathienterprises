import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Organization } from '../models/models';
import { ConstantsService } from './constants.service';

@Injectable({
    providedIn: 'root'
})
export class OrganizationService {
    private readonly STORAGE_KEY = 'roller_organization';
    private organization$: BehaviorSubject<Organization>;

    constructor(private constants: ConstantsService) {
        this.organization$ = new BehaviorSubject<Organization>(this.loadFromStorage());
    }

    private loadFromStorage(): Organization {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Default organization if none exists
        return {
            id: 'org-1',
            name: this.constants.COMPANY_NAME,
            gstin: this.constants.COMPANY_GSTIN,
            establishedDate: '2018-01-15',
            mobile: this.constants.COMPANY_CELL,
            email: 'contact@pragathient.com',
            address: this.constants.COMPANY_ADDRESS
        };
    }

    getOrganization(): Observable<Organization> {
        return this.organization$.asObservable();
    }

    updateOrganization(org: Organization): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(org));
        this.organization$.next(org);
    }
}
