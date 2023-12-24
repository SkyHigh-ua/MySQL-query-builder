import { QueryProps } from "../interfaces/Query";
import { Index, Table } from "../interfaces/Table";

function isIndexEqual(index1: Index, index2: Index) {
  return index1.name === index2.name &&
         index1.type === index2.type &&
         (index1.fields.length === index2.fields.length && index1.fields.every(field => index2.fields.includes(field)));
}

export function createAlterTable(table: Table, data: QueryProps): string {
  let alterStatements: string[] = [];
  let primaryKeyFields: string[] = [];
  const tableIndexes = table.index || [];
  const dataIndexes = data.index || [];

  data.fieldsData?.forEach(fieldData => {
    if (fieldData.name && (fieldData.isPK)) {
      primaryKeyFields.push(fieldData.name);
    }

    switch (fieldData.action) {
        case 'add':
            let addStatement = `ADD COLUMN \`${fieldData.name}\` ${fieldData.type}`;
            if (fieldData.constraints) {
              if (fieldData.constraints.notNull) addStatement += ' NOT NULL';
              if (fieldData.constraints.default) addStatement += ` DEFAULT ${fieldData.constraints.default}`;
              if (fieldData.constraints.autoIncrement) addStatement += ' AUTO_INCREMENT';
              if (fieldData.constraints.unique) data.index?.push({type: 'unique', name: `${fieldData.name}_UNIQUE`, fields: [`${fieldData.name}`]});
            }
            alterStatements.push(addStatement);
            break;

        case 'remove':
            alterStatements.push(`DROP COLUMN \`${fieldData.name}\``);
            break;

        case 'modify':
          const oldField = table.fields.find(field => field.name === fieldData.name);
          let modifyStatement = `MODIFY COLUMN \`${fieldData.name}\` ${fieldData.type}`;
          if (fieldData.constraints && fieldData.name) {
            if (fieldData.constraints.notNull) modifyStatement += ' NOT NULL';
            if (fieldData.constraints.default) modifyStatement += ` DEFAULT ${fieldData.constraints.default}`;
            if (fieldData.constraints.autoIncrement) modifyStatement += ' AUTO_INCREMENT';
            if (fieldData.constraints.unique && !oldField?.constraints?.unique) data.index?.push({type: 'unique', name: `${fieldData.name}_UNIQUE`, fields: [`${fieldData.name}`]});
          }
          alterStatements.push(modifyStatement);
          break;
    }
  });

  const oldPrimaryKeyFields = table.fields.filter(field => field.isPK).map(field => field.name);

  if (!primaryKeyFields.every(field => oldPrimaryKeyFields.includes(field))) {
    alterStatements.push(`DROP PRIMARY KEY, ADD PRIMARY KEY (${primaryKeyFields.map(field => `\`${field}\``).join(', ')})`);
  }

  tableIndexes.forEach(tableIndex => {
    if (!dataIndexes.some(dataIndex => isIndexEqual(dataIndex, tableIndex))) {
      switch (tableIndex.type) {
        case 'fk':
          alterStatements.push(`DROP FOREIGN KEY \`${tableIndex.name}\``);
          break;
        case 'unique':
        case 'index':
          alterStatements.push(`DROP INDEX \`${tableIndex.name}\``);
          break;
      }
    }
  });

  dataIndexes.forEach(dataIndex => {
    if (!tableIndexes.some(tableIndex => isIndexEqual(dataIndex, tableIndex))) {
      switch (dataIndex.type) {
        case 'fk':
          const reference = data.fieldsData?.find(field => field.name === dataIndex.fields[0]);
          if (reference && reference.references) alterStatements.push(`ADD CONSTRAINT \`${dataIndex.name}\` FOREIGN KEY (${dataIndex.fields[0]}) REFERENCES \`${reference.references.schema}\`.\`${reference.references.table}\`(\`${reference.references.column}\`)`);
          break;
        case 'unique':
          alterStatements.push(`ADD UNIQUE \`${dataIndex.name}\` (${dataIndex.fields[0]})`);
          break;
        case 'index':
          alterStatements.push(`ADD INDEX \`${dataIndex.name}\` (${dataIndex.fields.join(', ')})`);
          break;
      }
    }
  });

  if ((data.title && data.title !== table.title) || (data.schema && data.schema !== table.schema)) {
    alterStatements.unshift(`RENAME TO \`${data.schema !== table.schema ? data.schema : table.schema}\`.\`${data.title !== table.title ? data.title : table.title}\``);
  }

  if (alterStatements.length > 0) {
    return `ALTER TABLE \`${table.schema}\`.\`${table.title}\` ${alterStatements.join(',\n\t')};`;
  } else {
    return '';
  }
}
