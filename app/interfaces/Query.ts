import { Field, Index, Table } from "./Table";

export interface FieldData extends Omit<Field, 'name' | 'type'> {
    name?: string;
    type?: string;
    data?: {
        name: string;
        value?: string;
    };
    func?: string;
    action?: string;
};

export interface QueryProps {
    distinct?: boolean;
    where?: string;
    orderBy?: string;
    limit?: number;
    groupBy?: string;
    fieldsData?: FieldData[];
    schema?: string;
    title?: string;
    index?: Index[];
    table?: Table;
    oldTables?: Table[];
};

export interface Query {
    type: string;
    props: QueryProps;
};