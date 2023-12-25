import { QueryProps } from "../interfaces/Query";
import { Table } from "../interfaces/Table";

export function createCreateTable(tableData: QueryProps): string {

    if (!tableData.title || !tableData.fieldsData || !tableData.schema) {
        throw new Error("Table information is required to generate a CREATE TABLE script.");
    }

    const table: Table = {
        title: tableData.title,
        schema: tableData.schema,
        fields: tableData.fieldsData.map((field) => ({
            name: field?.name || 'undefined',
            type: field?.type || 'undefined',
            isPK:  field?.isPK,
            isFK:  field?.isFK,
            constraints: field?.constraints,
        })),
    };

    let script = `CREATE TABLE \`${table.schema}\`.\`${table.title}\` (\n`;
    const index: string[] = [];
    const pkFields: string[] = [];

    const fieldLines = table.fields.map(field => {
        let fieldLine = `\`${field.name}\` ${field.type}`;
        if (field.constraints) {
            if (field.constraints.notNull) {
                fieldLine += ' NOT NULL';
            }
            if (field.constraints.unique) {
                index.push(`UNIQUE INDEX \`${field.name}_UNIQUE\` (\`${field.name}\` ASC) VISIBLE`);
            }
            if (field.constraints.autoIncrement) {
                fieldLine += ' AUTO_INCREMENT';
            }
            if (field.constraints.default) {
                fieldLine += ` DEFAULT ${field.constraints.default}`;
            }
        }
        if (field.isPK) {
            pkFields.push(field.name);
        }
        return fieldLine;
    });

    script += fieldLines.join(",\n");

    script += `,\nPRIMARY KEY (\`${pkFields.join("`, `")}\`)`;

    if (index.length > 0) script += ',\n';
    script += index.join(",\n");

    script += "\n);";

    return script;
};