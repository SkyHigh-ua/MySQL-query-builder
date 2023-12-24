import { Table } from '../Interfaces/Table'

export function createDropTable(table: Table, tables: Table[]): string {
    let queries = [];

    for (const dbTable of tables) {
      for (const field of dbTable.fields) {
        if (field.isFK === true && field.references !== undefined && dbTable.index !== undefined && field.references.table === table.title && field.references.schema === table.schema) {
          const constraintName = dbTable.index.find((inx) => inx.type === 'fk' && inx.fields.includes(field.name));
          if(constraintName) {
            let alterQuery = `ALTER TABLE \`${dbTable.schema}\`.\`${dbTable.title}\` DROP CONSTRAINT \`${constraintName.name}\`;`;
            queries.push(alterQuery);
          }
        }
      }
    }
  
    let dropQuery = `DROP TABLE \`${table.schema}\`.\`${table.title}\`;`;
    queries.push(dropQuery);
  
    return queries.join('\n');
};