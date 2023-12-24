import { QueryProps, FieldData } from "../interfaces/Query";
import { SelectedField, Table, Field } from "../interfaces/Table";

export function isValidName(name: string | undefined): boolean {
    return name ? /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) : true;
}

export function isValidDataType(type: string | undefined): boolean {
    const validTypes = [
        'int', 'tinyint', 'smallint', 'mediumint', 'bigint', 'bit',
        'varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext',
        'date', 'datetime', 'timestamp', 'time', 'year',
        'float', 'double', 'decimal',
        'boolean', 'enum', 'set',
        'binary', 'varbinary', 'tinyblob', 'mediumblob', 'blob', 'longblob'
    ];

    if (!type) return true;

    const typePattern = /^(?<baseType>[a-z]+)(\((?<param>[^\)]+)\))?$/;
    const match = type.toLowerCase().match(typePattern);

    if (!match || !match.groups) return false;

    const { baseType, param } = match.groups;
    if (!validTypes.includes(baseType)) return false;
    if (param) {
        switch (baseType) {
            case 'varchar':
            case 'char':
            case 'binary':
            case 'varbinary':
                return /^\d+$/.test(param);
        }
    }

    return true;
}

export function isValidFieldData(data: string | undefined, type: string | undefined, notNull: boolean | undefined): boolean {
    if (data === undefined || type === undefined || data === '') return true;
    if (notNull && data === 'NULL') {
        return false;
    } else if (!notNull && data === 'NULL'){
        return true;
    }

    const typePattern = /^(?<baseType>[a-z]+)(\((?<param>[^\)]+)\))?$/;
    const match = type.toLowerCase().match(typePattern);

    if (!match || !match.groups) return false;

    const { baseType, param } = match.groups;

    switch (baseType.toLowerCase()) {
        case 'int':
        case 'tinyint':
            if (!/^\d+$/.test(data)) {
                return false;
            }
            break;
        case 'varchar':
        case 'text':
            if (param) {
                if (data.length > parseInt(param)) {
                    return false;
                }
            }
            break;
        case 'date':
        case 'datetime':
            if (isNaN(Date.parse(data))) {
                return false;
            }
            break;
        case 'float':
        case 'double':
        case 'decimal':
            if (isNaN(parseFloat(data))) {
                return false;
            }
            break;
        case 'boolean':
            if (data !== 'true' && data !== 'false') {
                return false;
            }
            break;
        default:
            return false;
    }

    return true;
}

function isValidCondition(condition:string, data:string, type: string, notNull?: boolean): boolean {
    if (condition === 'BETWEEN') {
        const match = data.match(/^([^,]+) AND ([^,]+)$/);
        if(match) {
            if(!isValidFieldData(match[1], type, notNull)) return false;
            if(!isValidFieldData(match[2], type, notNull)) return false;
        } else {
            return false;
        }
    } else if (condition === 'IN') {
        const trimmedData = data.replace(/^\(|\)$/g, '');
        const values = trimmedData.split(',');
        if (!values.every(value => isValidFieldData(value.trim(), type, notNull))) return false;
    } else {
        if(!isValidFieldData(data, type, notNull)) return false;
    }
    return true;
}

export function isValidWhereClause({whereClause, table, fields}: {whereClause: string | undefined, table?: Table | null, fields?: SelectedField[]}) {
    if (whereClause === undefined || whereClause === '') return true;
    if (!whereClause.trim()) {
        return false;
    }

    const conditions = whereClause.split(/\s+(AND|OR)\s+/);

    for (const condition of conditions) {
        if (['AND', 'OR'].includes(condition)) continue;
        const match = condition.match(/(\w+)\s*(=|<|>|<=|>=|<>|!=|LIKE|BETWEEN|IN)\s*(.+)/);
        if (match) {
            const fieldName = match[1]
            const type = match[2]
            const fieldData = match[3]
            if (fields) {
                const field = fields.find(field => field.field.name === fieldName);
                if(!field) return false;
                if(!isValidCondition(type, fieldData, field.field.type, field.field.constraints?.notNull)) return false;
            } else if (table) {
                const field = table.fields.find(field => field.name === fieldName);
                if(!field) return false;
                if(!isValidCondition(type, fieldData, field.type, field.constraints?.notNull)) return false;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    return true;
}

export function validateOptions(options: QueryProps | null, type: string, selectedFields?: SelectedField[], selectedTable?: Table | null): [boolean, string] {
    let isTherePK = false;
    switch (type) {
        case "select":
            if (options === null) return [true, ''];
            if (options.where && !isValidWhereClause({whereClause: options.where, fields: selectedFields})) return [false, 'Where Clause is Incorrect.'];
            if (options.limit && options.limit <= 0) return [false, 'Limit value is Incorrect.'];
            return [true, ''];
        case "insert":
            if (options === null) return [false, 'At least one field must be filled.'];
            if (options?.fieldsData?.every(field => !field.data?.value)) return [false, 'At least one field must be filled.'];
            return [true, ''];
        case "update":
            if (options === null) return [false, 'At least one field must be filled.'];
            if (options?.fieldsData?.every(field => !field.data?.value)) return [false, 'At least one field must be filled.'];
            if (options.where && !isValidWhereClause({whereClause: options.where, table: selectedTable})) return [false, 'Where Clause is Incorrect.'];
            if (!options.where) return [false, 'Where Clause must be filled.'];
            return [true, ''];
        case "delete":
            if (options === null) return [false, 'At least one field must be filled.'];
            if (options.where && !isValidWhereClause({whereClause: options.where, table: selectedTable})) return [false, 'Where Clause is Incorrect'];
            if (!options.where) return [false, 'Where Clause must be filled.'];
            return [true, ''];
        case "create":
            if (options === null) return [false, 'At least one field must be filled.'];
            if (options.title ? !isValidName(options.title) : true) return [false, 'Table title is incorrect.'];
            if (options.schema ? !isValidName(options.schema) : true) return [false, 'Table schema is incorrect.'];
            if (!options.fieldsData) return [false, 'Table must have at least one field.'];
            for (const index in options.fieldsData) {
                const field = options.fieldsData[index]
                if(field.name ? !isValidName(field.name) : true) return [false, `Name is incorrect in ${field.name ? field.name : parseInt(index) + 1} field.`];
                if(field.type ? !isValidDataType(field.type) : true) return [false, `Type is incorrect in "${field.name}" field.`];
                if(field.constraints?.autoIncrement && field.type && !['int', 'bigint'].includes(field.type.toLowerCase())) return [false, `Auto increment can be applied only to INT fields ("${field.name}" field).`];
                if(field.constraints?.default && !isValidFieldData(field.constraints.default, field.type, field.constraints.notNull)) return [false, `Default value is incorrect in "${field.name}" field.`];
                if(field.isPK) isTherePK = true;
            }
            if (!isTherePK) return [false, 'Table must have at least one PK.'];
            return [true, ''];
        case "edit":
            if (options === null) return [false, 'At least one field must be filled.'];
            if (options.title ? !isValidName(options.title) : true) return [false, 'Table title is incorrect.'];
            if (options.schema ? !isValidName(options.schema) : true) return [false, 'Table schema is incorrect.'];
            if (!options.fieldsData) return [false, 'Table must have at least one field.'];
            for (const index in options.fieldsData) {
                const field = options.fieldsData[index]
                if(field.name ? !isValidName(field.name) : true) return [false, `Name is incorrect in ${field.name ? field.name : parseInt(index) + 1} field.`];
                if(field.type ? !isValidDataType(field.type) : true) return [false, `Type is incorrect in "${field.name}" field.`];
                if(field.constraints?.autoIncrement && field.type && !['int', 'bigint'].includes(field.type.toLowerCase())) return [false, `Auto increment can be applied only to INT fields ("${field.name}" field).`];
                if(field.constraints?.default && !isValidFieldData(field.constraints.default, field.type, field.constraints.notNull)) return [false, `Default value is incorrect in "${field.name}" field.`];
                if(field.isPK) isTherePK = true;
            }
            if (!isTherePK) return [false, 'Table must have at least one PK.'];
            return [true, ''];
        case "drop":
            return [true, ''];
    
        default:
            return [false, 'Unknown Query Type'];
    }
}

function areFieldsEqual(field: Field, fieldData: FieldData): boolean {
    return field.name === fieldData.name &&
        field.type === fieldData.type &&
        field.isPK === fieldData.isPK &&
        field.constraints?.autoIncrement === fieldData.constraints?.autoIncrement &&
        field.constraints?.default === fieldData.constraints?.default &&
        field.constraints?.notNull === fieldData.constraints?.notNull &&
        field.constraints?.unique === fieldData.constraints?.unique;
}

export function isTableAltered(table: Table, queryProps: QueryProps): boolean {
    if (!table.fields || !queryProps.fieldsData) {
        return false;
    }

    if (table.title !== queryProps.title || table.schema !== queryProps.schema) {
        return true;
    }

    if (table.fields.length !== queryProps.fieldsData.length) {
        return true;
    }

    for (let i = 0; i < table.fields.length; i++) {
        if (!areFieldsEqual(table.fields[i], queryProps.fieldsData[i])) return true;
        if(queryProps.fieldsData[i].action === 'remove') return true;
    }

    return false;
}
