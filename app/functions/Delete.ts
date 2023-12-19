import { QueryProps } from "../Interfaces/Query";
import { Table } from "../Interfaces/Table";

export function createDelete(table: Table, data: QueryProps): string {
    const { schema, title } = table;
    const { where } = data;

    if (!schema || !title || !where) {
        throw new Error("Invalid input data for SQL DELETE statement generation.");
    }

    const deleteStatement = `DELETE FROM \`${schema}\`.\`${title}\` WHERE ${where};`;
    return deleteStatement;
};