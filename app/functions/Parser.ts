import { Field, Table, Index } from '../interfaces/Table';

export class SQLCreateTableParser {
  private sql: string;
  private tables: Table[] = [];

  constructor(sqlScript: string) {
    this.sql = sqlScript.replace(/DROP DATABASE .*?;/gi, '')
                        .replace(/CREATE DATABASE .*?;/gi, '')
                        .trim();
    this.parseSQLScript();
  }

  private isValidCreateTableStatement(statement: string): boolean {
    return statement.trim().toUpperCase().startsWith('CREATE TABLE') && statement.trim().endsWith(')');
  }

  private parseSQLScript(): void {
    const statements = this.sql.split(/;(?![^()]*\))/g).map(s => s.trim()).filter(s => s);

    statements.forEach(statement => {
      if (this.isValidCreateTableStatement(statement)) {
        const table = this.parseCreateTableStatement(statement);
        if (table) {
          this.tables.push(table);
        }
      }
    });
  }

  private parseCreateTableStatement(statement: string): Table | null {
    const tableNameMatch = statement.match(/CREATE TABLE (IF NOT EXISTS )?`?(\w+)?`?\.`?(\w+)`?/i);
    if (!tableNameMatch) return null;

    const schema = tableNameMatch[2] ? tableNameMatch[2] : "New Schema";
    const title = tableNameMatch[3];
    const index: Index[] = [];
    const fieldsDefinitions = statement.substring(statement.indexOf("(") + 1, statement.lastIndexOf(")"));

    const fields: Field[] = [];
    const primaryKeyColumns: string[] = [];

    const fieldAndConstraintDefs = fieldsDefinitions.split(/,(?![^()]*\))|,(?![^`]*`)/g);

    fieldAndConstraintDefs.forEach(fieldDef => {
      fieldDef = fieldDef.trim();

      if (fieldDef.toUpperCase().startsWith('PRIMARY KEY')) {
        const pkMatch = fieldDef.match(/PRIMARY KEY \(([^)]+)\)/i);
        if (pkMatch) {
          primaryKeyColumns.push(...pkMatch[1].replace(/`/g, '').split(',').map(col => col.trim()));
        }
      } else if (fieldDef.toUpperCase().includes('FOREIGN KEY')) {
        let fkMatch;
        const fkMatches = [];
        const fkMatchRegex = /CONSTRAINT `?(\w+)`? FOREIGN KEY\s+\(`?(\w+)`?\)\s+REFERENCES\s+`?(\w+)?`?\.?`?(\w+)`?\s*\(`?(\w+)`?\)/gi;
        const cleanedStatement = fieldDef.replace(/\s+/g, ' ');

        while ((fkMatch = fkMatchRegex.exec(cleanedStatement)) !== null) {
          fkMatches.push(fkMatch);
        }

        for (const fkMatch of fkMatches) {
          const [_, constraintName, columnName, fkSchema, fkTable, fkColumn] = fkMatch;
          const field = fields.find(f => f.name === columnName);
          if (field) {
            index.push({
              name: constraintName,
              type: 'fk',
              fields: [field.name],
            });
            field.isFK = true;
            field.references = {
              schema: fkSchema,
              table: fkTable,
              column: fkColumn,
            };
          };
        }
      } else if (!fieldDef.toUpperCase().includes('INDEX') && !fieldDef.toUpperCase().includes('CONSTRAINT')) {
        const fieldPattern = /`?([^\s,`]+)`?\s+([^\s,]+)(\([^)]+\))?/;
        const parts = fieldDef.match(fieldPattern);
        if (parts) {
          let fieldType = parts[2];
          const fieldDetails = parts[3];

          if (fieldDetails) {
            fieldType += fieldDetails;
          }
          const field: Field = {
            name: parts[1],
            type: fieldType,
            constraints: { unique: false, notNull: false, autoIncrement: false }
          };
  
          
          if (fieldDef.toUpperCase().includes('NOT NULL') && field.constraints) {
            field.constraints.notNull = true;
          }
          if (fieldDef.toUpperCase().includes('AUTO_INCREMENT') && field.constraints) {
            field.constraints.autoIncrement = true;
          }
          const defaultMatch = fieldDef.match(/DEFAULT\s+([^ ]+)/i);
          if (defaultMatch && field.constraints) {
            field.constraints.default = defaultMatch[1];
          }
          
          fields.push(field);
        }
      } else if (fieldDef.toUpperCase().includes('INDEX') || fieldDef.toUpperCase().includes('UNIQUE')) {
        const indexMatch = fieldDef.match(/(UNIQUE )?INDEX `?(\w+)`? \(([^)]+)\)/i);
        if (indexMatch) {
          const indexType = indexMatch[1] ? 'unique' : 'index';
          const indexName = indexMatch[2];
          const indexFields = indexMatch[3].replace(/`/g, '').split(',').map(field => field.trim().split(' ')[0]);
          if(indexMatch[1]) {
            for (const fieldName of indexFields) {
              const field = fields.find(f => f.name === fieldName);
              if (field && field.constraints) {
                field.constraints.unique = true;
              };
            } 
          }
          index.push({
            name: indexName,
            type: indexType,
            fields: indexFields
          });
        }
      }});

    primaryKeyColumns.forEach(pkColumn => {
      const field = fields.find(f => f.name === pkColumn);
      if (field && title !== field.references?.table) {
        field.isPK = true;
      }
    });

    return { schema, title, fields, index };
  }

  public getTables(): Table[] {
    return this.tables;
  }
}
