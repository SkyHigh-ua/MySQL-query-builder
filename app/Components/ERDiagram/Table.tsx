import { useContext, useEffect, memo, type FC, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Field } from '../../Interfaces/Table'
import { ProjectContext } from '../../context/ProjectContext'

const Table: FC<NodeProps> = ({ data }) => {
  const { selectedFields, setSelectedFields, selectedTable, selectable }  = useContext(ProjectContext);
  const [ isSelected, setIsSelected ] = useState(false);

  useEffect(() => {
    setSelectedFields(selectedFields);
  }, [selectedFields]);

  useEffect(() => {
    if(data.title === selectedTable?.data.title && data.schema === selectedTable?.data.schema) {
      setIsSelected(true);
    } else {
      setIsSelected(false);
    }
  }, [selectedTable]);

  const handleFieldClick = (fieldName: string, fieldType: string) => {
    if (selectable === 'fields') setSelectedFields((prevSelectedFields) => {
      const fieldExists = prevSelectedFields.some(field =>
        field.field.name === fieldName && field.table === data.title && field.schema === data.schema
      );

      if (fieldExists) {
        return prevSelectedFields.filter(
          field => field.field.name !== fieldName || field.table !== data.title || field.schema !== data.schema
        );
      } else {
        const newField = { 
          table: data.title, 
          schema: data.schema,
          field: data.fields.find((field: Field) => field.name === fieldName) 
        };
        return [...prevSelectedFields, newField];
      }
    });
  };

  const isFieldSelected = (fieldName: string, fieldType: string) => {
    return selectedFields.some(field =>
      field.field.name === fieldName && field.field.type === fieldType && field.table === data.title
    );
  };

  return (
    <div className={`bg-white ${isSelected ? 'border-2 border-gray-800' : 'border-2 border-gray-500'} rounded shadow overflow-hidden`}>
      <div className="bg-blue-500 p-2">
        <h3 className="text-white text-sm font-semibold">{`${data.schema}-${data.title}`}</h3>
      </div>
      <ul className="text-xs">
        {data.fields.map((field: Field, index: number) => (
          <li
            key={index}
            className={`flex justify-between items-center px-2 py-1 cursor-pointer ${
              isFieldSelected(field.name, field.type) ? 'bg-gray-300' : field.isFK && field.isPK ? 'bg-blue-200' : field.isPK ? 'bg-green-200' : field.isFK ? 'bg-yellow-200' : index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
            }`}
            onClick={() => handleFieldClick(field.name, field.type)}
          >
            {field.isPK && (
              <Handle
                type="source"
                position={Position.Left}
                id={`pk-${data.title}-${field.name}`}
                style={{ top: 'auto' }}
              />
            )}
            <div className="flex flex-1 items-center">
              <span className="font-mono">{field.name}</span>: <span className="text-gray-700">{field.type}</span>
            </div>
            <div className="flex items-center">
              {field.isPK && (
                <span className="text-green-600 ml-2">PK</span>
              )}
              {field.isFK && (
                <span className="text-yellow-600 ml-2">FK</span>
              )}
            </div>   
            <Handle
              type="target"
              position={Position.Right}
              id={`fk-${data.title}-${field.name}`}
              style={{ top: 'auto' }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default memo(Table);