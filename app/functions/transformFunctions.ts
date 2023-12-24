import { Table } from '../interfaces/Table';
import { type Edge, type Node } from 'reactflow';

export const transformTablesToFlowElements = (tables: Table[], positions: {x: number, y: number}[]) => {
    const Nodes = tables.map((table, index) => ({
      id: `${index}`,
      type: 'table',
      data: table,
      position: positions[index],
    }));
  
    const Edges = tables.reduce<Edge[]>((edges, table, tableIndex) => {
      const relations = table.fields.filter((field) => field.isFK);
      return [
        ...edges,
        ...relations.flatMap((relation) => {
          const targetTable = tables.find((t) => t.title === relation.references?.table);
          if (!targetTable) {
            console.error('Foreign key table not found:', relation.references?.table);
            return [];
          }
          const targetIndex = tables.indexOf(targetTable);
  
          const edgeType = relation.constraints?.unique ? 'one' : 'many';
  
          return {
            id: `e${tableIndex}-${targetIndex}-${relation.name}`,
            type: 'smoothstep',// edgeType,
            source: `${targetIndex}`,
            target: `${tableIndex}`,
            sourceHandle: `pk-${targetTable.title}-${relation.references?.column}`,
            targetHandle: `fk-${table.title}-${relation.name}`,
            markerStart: 'one',
            markerEnd: `${edgeType}`,
          };
        }),
      ];
    }, []);
    return { nodes: Nodes, edges: Edges };
};

export const transformTableToNode = (table: Table, id: number) => {
    return {
      id: `${id}`,
      type: 'table',
      data: table,
      position: {x: 0, y: 0},
    };
};

export const transformTableToEdges = (table: Table, id: number, nodes: Node[]) => {
    const relations = table.fields.filter((field) => field.isFK);
    return [
      ...relations.flatMap((relation) => {
        const targetTable = nodes.find((t) => t.data.title === relation.references?.table);
        if (!targetTable) {
          console.error('Foreign key table not found:', relation.references?.table);
          return [];
        }
        const targetIndex = targetTable.id;

        const edgeType = relation.constraints?.unique ? 'one' : 'many';

        return {
          id: `e${id}-${targetIndex}-${relation.name}`,
          type: 'smoothstep',
          source: `${targetIndex}`,
          target: `${id}`,
          sourceHandle: `pk-${targetTable.data.title}-${relation.references?.column}`,
          targetHandle: `fk-${table.title}-${relation.name}`,
          markerStart: 'one',
          markerEnd: `${edgeType}`,
        };
      }),
    ];
};