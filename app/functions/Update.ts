import { QueryProps } from "../Interfaces/Query";
import { Table } from "../Interfaces/Table";

export function createUpdate(table: Table, data: QueryProps): string {
    const { schema, title } = table;
    const { where, fieldsData } = data;

    if (!schema || !title || !fieldsData || fieldsData.length === 0 || !where) {
        throw new Error("Invalid input data for SQL statement generation.");
    }
    
    const fieldUpdates = fieldsData.filter((field => field?.data?.name && field?.data?.value)).map(field => `\`${(field.data ? field.data.name : 'undefined')}\` = '${((field.data ? field.data.value : 'undefined') || 'undefined').replace(/'/g, "\\'")}'`).join(", ");

    const updateStatement = `UPDATE \`${schema}\`.\`${title}\` SET ${fieldUpdates} WHERE ${where};`;
    return updateStatement;
};