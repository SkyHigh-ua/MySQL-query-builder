import React, { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { SQLCreateTableParser } from '../functions/Parser';
import { calculateTablePosition } from '../functions/calculateTablePosition'
import { transformTablesToFlowElements } from '../functions/transformFunctions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
interface DialogWindowProps {
  onClose: () => void;
}

export const DialogWindow: React.FC<DialogWindowProps> = ({ onClose }) => {
  const { setNodes, setEdges, addAlert } = useContext(ProjectContext);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleCreateNew = () => {
    setNodes([]);
    setEdges([]);
    onClose();
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.sql')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const parser = new SQLCreateTableParser(text);
          const newTables = parser.getTables()
          if (newTables.length > 0) {
            addAlert(`${newTables.length} table${newTables.length === 1 ? ' was' : 's were'} found in the script.`, "success", false);
            const positions = newTables.map((table, index) => calculateTablePosition(index, newTables.length));
            const {nodes: newNodes, edges: newEdges} = transformTablesToFlowElements(newTables, positions);
            setNodes(newNodes);
            setEdges(newEdges);
          } else {
            addAlert("No completed CREATE TABLE statements were found.", "error", false);
          }
          onClose();
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a .sql file.');
      onClose();
    }
  };


  return (
    <div className="fixed inset-0">
      <div className="fixed inset-0 z-[50] flex items-center justify-center">
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96 relative">
        <button
            className="absolute top-2 right-2 bg-gray-700 text-white rounded-full w-4 h-4 flex items-center justify-center hover:shadow-2xl"
            onClick={() => {addAlert(`Welcome back.`, "success", false); onClose()}}
          >
            <FontAwesomeIcon className="hover:text-gray-300" icon={faXmark}/>
          </button>
          <div className="flex flex-col gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".sql"
            />
            <button
              className="bg-blue-500 text-white py-2 rounded-md border-blue-500 border-2 hover:shadow-lg hover:text-gray-300"
              onClick={handleLoadClick}
            >
              Load SQL script
            </button>
            <button
              className="bg-gray-700 text-white py-2 rounded-md border-gray-700 border-2 hover:shadow-lg hover:text-gray-300"
              onClick={handleCreateNew}
            >
              Create New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};