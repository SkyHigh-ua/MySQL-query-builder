import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { useNodesState, useEdgesState, type Edge, type Node, type NodeChange, type EdgeChange } from 'reactflow';
import { Table, SelectedField, Field } from '../interfaces/Table';
import { Query } from '../interfaces/Query';
import { transformTableToNode, transformTableToEdges } from '../functions/transformFunctions';
import { Alert } from '../interfaces/Alert';

export interface ProjectContextProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node<any, string | undefined>[]>>;
  onNodesChange: (changes: NodeChange[]) => void;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge<any>[]>>;
  onEdgesChange: (changes: EdgeChange[]) => void;
  selectedFields: SelectedField[];
  setSelectedFields: React.Dispatch<React.SetStateAction<SelectedField[]>>;
  selectedTable: Node | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<Node | null>>;
  queryData: Query;
  setQueryData: React.Dispatch<React.SetStateAction<Query>>;
  isTerminalEnabled: boolean;
  setIsTerminalEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isNewQuery: boolean | string;
  setIsNewQuery: React.Dispatch<React.SetStateAction<boolean | string>>;
  selectable: string; 
  setSelectable: React.Dispatch<React.SetStateAction<string>>;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  handleAddTable: (newTableData: Table) => void;
  handleEditTable: (initialNode: Node, updatedTableData: Table) => void;
  handleRemoveTable: (node: Node) => void;
  addAlert: (message: string, type: 'success' | 'error' | 'warning', dismissible: boolean) => void;
}

export const ProjectContext = createContext<ProjectContextProps>({
  nodes: [], 
  setNodes: () => {},
  onNodesChange: () => {},
  edges: [], 
  setEdges: () => {}, 
  onEdgesChange: () => {},
  selectedFields: [],
  setSelectedFields: () => {},
  selectedTable: null,
  setSelectedTable: () => {},
  queryData: { type: '', props: {} }, 
  setQueryData: () => {},
  isTerminalEnabled: false, 
  setIsTerminalEnabled: () => {},
  isNewQuery: true, 
  setIsNewQuery: () => {},
  selectable: '', 
  setSelectable: () => {},
  alerts: [], 
  setAlerts: () => {},
  handleAddTable: () => {},
  handleEditTable: () => {},
  handleRemoveTable: () => {},
  addAlert: () => {},
});

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [isTerminalEnabled, setIsTerminalEnabled] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [selectedTable, setSelectedTable] = useState<Node | null>(null);
  const [isNewQuery, setIsNewQuery] = useState<boolean | string>(true);
  const [selectable, setSelectable] = useState('');
  const [queryData, setQueryData] = useState({ type: '', props: {} });
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const handleAddTable = useCallback((newTableData: Table) => {
    setNodes((prevNodes) => [...prevNodes, transformTableToNode(newTableData, Date.now())]);
    setEdges((prevEdges) => [...prevEdges, ...transformTableToEdges(newTableData, Date.now(), nodes)])
  }, [nodes, edges]);

  const handleEditTable = useCallback((initialNode: Node, updatedTableData: Table) => {
    const tableName = initialNode.data.title;
    const tableSchema = initialNode.data.schema;
    const newNodes = nodes.map((node) =>
    (node.data.title === tableName && node.data.schema === tableSchema) ? { ...node, data: {...node.data, ...updatedTableData} } : node);
    setNodes(newNodes);
    setEdges((prevEdges) => {
      const oldEdges = prevEdges.filter((edge) => 
        initialNode.id !== edge.target
      ).map((edge) => {
        const newEdge = edge;
        if (newEdge.targetHandle) {
          const fieldName = newEdge.targetHandle.split('-')[2];
          const targetNode = newNodes.find(node => node.id === newEdge.target);
          if (targetNode) {
            const targetField = targetNode.data.fields.find((field: Field) => field.name === fieldName);
            newEdge.markerEnd = targetField.constraints.unique ? 'one' : 'many';
          }
        }
        return newEdge;
      })
      return [...oldEdges, ...transformTableToEdges({...initialNode.data, ...updatedTableData}, parseInt(initialNode.id), nodes)]
    })
  }, [nodes, edges]);

  const handleRemoveTable = useCallback((node: Node) => {
    const oldNodes = nodes.map(node => node.data);
    const tableName = node.data.title;
    const tableSchema = node.data.schema;
    setNodes((prevNodes) => {
      const nodesWithoutDeletedOne = prevNodes.filter((oldNode) => 
        oldNode.data.title !== tableName || oldNode.data.schema !== tableSchema
      );
  
      const updatedTables = nodesWithoutDeletedOne.map((node) => {
        const updatedFields = node.data.fields.map((field: Field) => {
          if (field.isFK && field.references) {
            if (field.references.table === tableName && field.references.schema === tableSchema) {
              return { ...field, isFK: false, references: undefined };
            }
          }
          return field;
        });
        
        return { ...node, data: { ...node.data, fields: updatedFields } };
      });
      
      return updatedTables;
    });
    setEdges((prevEdges) => prevEdges.filter((edge) => 
        node.id !== edge.target && node.id !== edge.source
      ));
    setIsTerminalEnabled(true);
    setQueryData({type: 'drop', props: {table: node.data, oldTables: oldNodes}});
  }, [nodes, edges]);  

  const addAlert = (message: string, type: 'success' | 'error' | 'warning', dismissible: boolean) => {
    const newAlert = {
      id: Date.now(),
      message: message,
      dismissible,
      type,
    };
    setAlerts(currentAlerts => [...currentAlerts, newAlert]);
  };

  const contextValue = {
    nodes, 
    setNodes,
    onNodesChange,
    edges, 
    setEdges, 
    onEdgesChange,
    selectedFields,
    setSelectedFields,
    selectedTable, 
    setSelectedTable,
    queryData, 
    setQueryData,
    isTerminalEnabled, 
    setIsTerminalEnabled,
    isNewQuery, 
    setIsNewQuery,
    selectable, 
    setSelectable,
    alerts, 
    setAlerts,
    handleAddTable,
    handleEditTable,
    handleRemoveTable,
    addAlert,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};
