export interface Index {
  name: string;
  type: string;
  fields: string[];
}

export interface Constraints {
  unique: boolean;
  notNull: boolean;
  autoIncrement: boolean;
  default?: string;
}

export interface Field {
    name: string;
    type: string;
    isPK?: boolean;
    isFK?: boolean;
    references?: { schema: string, table: string, column: string };
    constraints?: Constraints;
}

export interface SelectedField {
  table: string;
  schema: string;
  field: Field;
}
  
export interface Table {
  schema: string;
  title: string;
  index?: Index[];
  fields: Field[];
}
  