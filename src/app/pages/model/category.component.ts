export interface Category {
    id?: string;
    active?: boolean;
    name?: string;
    description?: string;
    tenantId: number;
    displayOrder?: number;
}
