import { QueryProps } from '../interfaces/Query';
import { Table, SelectedField } from '../interfaces/Table';

interface relation {
    fromSchema: string,
    fromTable: string,
    fromField: string,
    toSchema: string,
    toTable: string,
    toField: string
};

interface involvedTable {
    schema: string,
    title: string
}

export function createSelect(SelectedFields: SelectedField[], Tables: Table[], Settings: QueryProps) {
    let involvedTables = SelectedFields.map(field => ({
        schema: field.schema,
        title: field.table
    })).filter((table, index, self) =>
        index === self.findIndex(t => t.schema === table.schema && t.title === table.title)
    );

    let allJoins: relation[] = [];
        Tables.forEach(table => {
            table.fields.forEach(field => {
                if (field.isFK && field.references) {
                    allJoins.push({
                        fromSchema: field.references.schema,
                        fromTable: field.references.table,
                        fromField: field.references.column,
                        toSchema: table.schema,
                        toTable: table.title,
                        toField: field.name,
                    });
                }
            });
        });
    
    function findJoinPath(startTable: involvedTable, endTable: involvedTable, allJoins: relation[], path: relation[] = [], visited = new Set()): relation[] | null {
        const tableId = `${startTable.schema}.${startTable.title}`;
        if (visited.has(tableId)) {
            return null;
        }
        visited.add(tableId);
        if (startTable.title === endTable.title && startTable.schema === endTable.schema) {
            return path;
        }
        let nextJoins = allJoins.filter(join => join.fromTable === startTable.title && join.fromSchema === startTable.schema);
        for (let join of nextJoins) {
            let newPath = findJoinPath({schema: join.toSchema, title: join.toTable}, endTable, allJoins, path.concat(join));
            if (newPath) return newPath;
        }
        return null;
    }

    let selectPart: string[] = [];
    Tables.forEach(table => {
        const tableFields = SelectedFields.filter(field => field.table === table.title && field.schema === table.schema);
        const indexOfField = tableFields.map(field => SelectedFields.indexOf(field));
        if (tableFields.length > 0) {
            if (tableFields.every((field, index) => (
                !(Settings.fieldsData && Settings.fieldsData[indexOfField[index]] && 
                Settings.fieldsData[indexOfField[index]].func))
            ) && table.fields.length === tableFields.length) {
                selectPart.push(`\`${table.schema}\`.\`${table.title}\`.*`);
            } else {
                tableFields.forEach((field, index) => {
                    const aggregationFunction = Settings.fieldsData && Settings.fieldsData[indexOfField[index]]?.func;
                    selectPart.push(`${aggregationFunction ? `${aggregationFunction}(` : ''}\`${field.schema}\`.\`${field.table}\`.\`${field.field.name}\`${aggregationFunction ? ')' : ''}`);
                });
            }
        }
        });

    let fromPart: string[] = [];
    const joinedTables: involvedTable[] = [];
    if(involvedTables.length > 1) {
        let joinPath = findJoinPath(involvedTables[0], involvedTables[1], allJoins);
        if (joinPath === null) {
            joinPath = findJoinPath(involvedTables[1], involvedTables[0], allJoins);
            fromPart.push(`\`${involvedTables[1].schema}\`.\`${involvedTables[1].title}\``);
        } else {
            fromPart.push(`\`${involvedTables[0].schema}\`.\`${involvedTables[0].title}\``);
        }
        if (joinPath === null) throw new Error('Some tables are not related.');
        joinPath.forEach(join => {
            if (!joinedTables.includes({schema: join.toSchema, title: join.toTable})){
                joinedTables.push({schema: join.toSchema, title: join.toTable});
                fromPart.push(`JOIN \`${join.toSchema}\`.\`${join.toTable}\` ON \`${join.fromSchema}\`.\`${join.fromTable}\`.\`${join.fromField}\` = \`${join.toSchema}\`.\`${join.toTable}\`.\`${join.toField}\``);
            }
        });
    } else {
        fromPart.push(`${involvedTables[0].schema}.${involvedTables[0].title}`);
    }
    for (let i = 2; i < involvedTables.length; i++) {
        let joinPath = findJoinPath(involvedTables[i - 1], involvedTables[i], allJoins);
        if (joinPath === null) {
            joinPath = findJoinPath(involvedTables[i], involvedTables[i - 1], allJoins);
        }
        if (joinPath === null) throw new Error('Some tables are not related.');
        joinPath.forEach(join => {
            if (!joinedTables.includes({schema: join.toSchema, title: join.toTable})){
                joinedTables.push({schema: join.toSchema, title: join.toTable});
                fromPart.push(`JOIN \`${join.toSchema}\`.\`${join.toTable}\` ON \`${join.fromSchema}\`.\`${join.fromTable}\`.\`${join.fromField}\` = \`${join.toSchema}\`.\`${join.toTable}\`.\`${join.toField}\``);
            }
        });
    }

    let additionalParts = "";
    if (Settings.where) additionalParts += ` WHERE ${Settings.where}`;
    if (Settings.groupBy) additionalParts += ` GROUP BY ${Settings.groupBy}`;
    if (Settings.orderBy) additionalParts += ` ORDER BY ${Settings.orderBy}`;
    if (Settings.limit) additionalParts += ` LIMIT ${Settings.limit}`;

    return `SELECT ${Settings.distinct ? 'DISTINCT ' : ''}${selectPart.join(", ")} FROM ${fromPart.join(" ")}${additionalParts};`;
}
