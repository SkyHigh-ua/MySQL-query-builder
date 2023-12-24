import { QueryProps } from "../Interfaces/Query";
import { Table } from "../Interfaces/Table";

export function createInsert(table: Table, data: QueryProps): string {
    const { schema, title } = table;
    const { fieldsData } = data;

    if (!schema || !title || !fieldsData || fieldsData.length === 0) {
        throw new Error("Invalid input data for SQL statement generation.");
    }
    

    const fieldNames = fieldsData.map(field => `\`${(field.data && field.data.name)}\``).join(", ");
    const fieldValues = fieldsData.filter(field => field.data?.value).map(field => `'${(field?.data?.value ? field.data.value : '').replace(/'/g, "\\'")}'`).join(", ");

    const insertStatement = `INSERT INTO \`${schema}\`.\`${title}\` (${fieldNames}) VALUES (${fieldValues});`;
    return insertStatement;
};