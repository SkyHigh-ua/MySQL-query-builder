export interface Alert { 
    id: number; 
    message: string; 
    dismissible: boolean; 
    type: 'success' | 'error' | 'warning';
}