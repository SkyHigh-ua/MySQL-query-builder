import { useCallback, useContext, useState } from 'react';
import ReactFlow, { addEdge, Background, Controls, type Connection, type Edge, type Node, type NodeChange, EdgeChange } from 'reactflow';
import Table from './Table';
import 'reactflow/dist/style.css';
import { ProjectContext } from '../../context/ProjectContext';
import { Field, Index } from '../../interfaces/Table';

const nodeTypes = {
  table: Table,
};

export function ERDiagram () {
  const { nodes, onNodesChange, edges, setEdges, onEdgesChange, setSelectedTable, setQueryData, handleEditTable, handleRemoveTable }  = useContext(ProjectContext);
  const [isInteractive, setIsInteractive] = useState(true);

  function toggleIsInteractive() {
    setIsInteractive(!isInteractive);
  }

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      if (params.targetHandle && params.source !== params.target && params.sourceHandle) {
        const fieldName = params.targetHandle.split('-')[2];
        const sourceFieldName = params.sourceHandle.split('-')[2];
        const sourceNode = nodes.find(node => node.id === params.source);
        const targetNode = nodes.find(node => node.id === params.target);
        if (targetNode && sourceNode){
          const targetField = targetNode.data.fields.find((field: Field) => field.name === fieldName);
          const customEdge = {
            ...params,
            id: `e${params.source}-${params.target}-${targetField.name}`,
            type: 'smoothstep',
            source: `${params.source}`,
            target: `${params.target}`,
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle,
            markerStart: 'one',
            markerEnd: targetField.constraints.unique ? 'one' : 'many'
          };
          setSelectedTable(targetNode);
          setQueryData({
            type: 'edit',
            props: {
              ...targetNode.data,
              index: [
                ...(targetNode.data.index ? targetNode.data.index : []),
                {
                  name: `fk_${fieldName}_${sourceFieldName}`,
                  type: 'fk',
                  fields: [fieldName],
                }
              ],
              fieldsData: [
                ...targetNode.data.fields.map((field: Field) => field.name === targetField.name ? 
                {
                  ...targetField,
                  isFK: true,
                  references: { schema: sourceNode.data.schema, table: sourceNode.data.title, column: sourceFieldName },
                }
                : field
                ),
              ]
            }
          });
          handleEditTable(targetNode, {
            schema: targetNode.data.schema,
            title: targetNode.data.title,
            index: [
              ...(targetNode.data.index ? targetNode.data.index : []),
              {
                name: `fk_${fieldName}_${sourceFieldName}`,
                type: 'fk',
                fields: [fieldName],
              }
            ],
            fields: [
              ...targetNode.data.fields.map((field: Field) => field.name === targetField.name ? 
              {
                ...targetField,
                isFK: true,
                references: { schema: sourceNode.data.schema, table: sourceNode.data.title, column: sourceFieldName },
              }
              : field
              ),
            ] as Field[]
          })
          setEdges((eds) => addEdge(customEdge, eds));
      }}
    },
    [edges, nodes]
  );

  const onNodeChange = (changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'remove') {
        const node = nodes.find((node) => node.id === change.id);
        setSelectedTable(null);
        if(node) handleRemoveTable(node);
      }
      if (change.type === 'select'){
        const node = nodes.find((node) => node.id === change.id);
        if (node && change.selected) {
          setSelectedTable(node);
        } else {
          if(isInteractive) setSelectedTable(null);
        }
      }
      if (change.type === 'position'){
        const node = nodes.find((node) => node.id === change.id);
        if (node) {
          setSelectedTable(node);
        } else {
          setSelectedTable(null);
        }
      };
    });
    if(isInteractive) onNodesChange(changes);
  }

  const onEdgeChange = (changes: EdgeChange[]) => {
    changes.map((change) => {
      if (change.type === 'remove') {
        const edge = edges.find((edge) => edge.id === change.id);
        if(edge && edge.targetHandle && edge.sourceHandle) {
          const fieldName = edge.targetHandle.split('-')[2];
          const targetNode = nodes.find(node => node.id === edge.target);
          if(targetNode){
            const targetField = targetNode.data.fields.find((field: Field) => field.name === fieldName);
            setSelectedTable(targetNode);
            setQueryData({
              type: 'edit',
              props: {
                index: [
                  ...targetNode.data.index.filter((index: Index) => !(index.type === 'fk' && index.fields.includes(fieldName)))
                ]
              }
            });
            handleEditTable(targetNode, {
              schema: targetNode.data.schema,
              title: targetNode.data.title,
              index: [
                ...targetNode.data.index.filter((index: Index) => !(index.type === 'fk' && index.fields.includes(fieldName)))
              ],
              fields: [
                ...targetNode.data.fields.map((field: Field) => field.name === targetField.name ? 
                {
                  ...targetField,
                  isFK: false,
                  references: undefined,
                }
                : field
                ),
              ] as Field[]
            });
          }
        };
      };
      return undefined;
    })
    onEdgesChange(changes);
  }
  
  return (
    <div className="Flow flex-grow font-size-12">
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodeChange}
        edges={edges}
        onEdgesChange={onEdgeChange}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}>
        <svg stroke="gray">
          <defs>
            <marker id="one" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="20" markerHeight="100" orient="auto-start-reverse">
              <path d="M 2 2 L 2 8 M 2 5" strokeWidth="0.5"/>
            </marker>
            <marker id="many" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="30" markerHeight="100" orient="auto-start-reverse">
              <path d="M0,5 L5,2 M0,5 L5,8" strokeWidth="0.3"/>
            </marker>
          </defs>
        </svg>
        <Background />
        <Controls position='bottom-right' onInteractiveChange={() => toggleIsInteractive()}/>
      </ReactFlow>
    </div>
  );
}