import React, { useState, useContext, useEffect } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { createSelect } from '../functions/Select';
import { createDropTable } from '../functions/DropTable';
import { createInsert } from '../functions/Insert';
import { createUpdate } from '../functions/Update';
import { createDelete } from '../functions/Delete';
import { createCreateTable } from '../functions/CreateTable';
import { createAlterTable } from '../functions/AlterTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faFilePen, faPlus, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';

const Terminal = () => {
  const { nodes, selectedFields, selectedTable, queryData, isTerminalEnabled, setIsTerminalEnabled, isNewQuery, setIsNewQuery, addAlert }  = useContext(ProjectContext);
  const [queries, setQueries] = useState<string[]>([]);
  const [pageName, setPageName] = useState<string>('NewScript');
  const [isEditableIndex, setIsEditableIndex] = useState<number | null>(null);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [isWarningShown, setIsWarningShown] = useState(false);

  const toggleTerminal = () => {
    setIsTerminalCollapsed(!isTerminalCollapsed);
  };

  useEffect(() => {
    const newQueries = [];
    if (queries.length) {
      if (['drop', 'edit'].includes(queryData.type) && queries[queries.length - 1] === 'UNION') {
        newQueries.push(...queries.slice(0, -1));
        newQueries[newQueries.length-1] = newQueries[newQueries.length-1]+';'
      } else newQueries.push(...queries);
    }
    let newQuery = null;
    try {
      switch(queryData.type){
        case 'select': {
          newQuery = createSelect(selectedFields, nodes.map((node) => node.data), queryData.props);
          if (!newQuery) {
            throw new Error('Something went wrong during select query generation.');
          }
          break;
        }
        case 'insert': {
          newQuery = selectedTable ? createInsert(selectedTable.data, queryData.props) : '';
          if (!newQuery) {
            throw new Error('Something went wrong during insert query generation.');
          }
          break;
        }
        case 'update': {
          newQuery = selectedTable ? createUpdate(selectedTable.data, queryData.props) : '';
          if (!newQuery) {
            throw new Error('Something went wrong during update query generation.');
          }
          break;
        }
        case 'delete': {
          newQuery = selectedTable ? createDelete(selectedTable.data, queryData.props) : '';
          if (!newQuery) {
            throw new Error('Something went wrong during delete query generation.');
          }
          break;
        }
        case 'create': {
          newQuery = createCreateTable(queryData.props);
          if (!newQuery) {
            throw new Error('Something went wrong during create table query generation.');
          }
          break;
        }
        case 'edit': {
          if (!selectedTable) {
            throw new Error('Table is not selected');
          }
          newQuery = createAlterTable(selectedTable.data, queryData.props);
          if (!newQuery) {
            throw new Error('Something went wrong during alter table query generation.');
          }
          break;
        }
        case 'drop': {
          if (!queryData.props.table || !queryData.props.oldTables) {
            throw new Error('Table data is missing');
          }
          newQuery = createDropTable(queryData.props.table, queryData.props.oldTables);
          break;
        }
      }
      if (newQuery) {
        newQueries.push(newQuery);
        if(!isTerminalEnabled) setIsTerminalEnabled(true);
        setQueries(newQueries);
      }
    }
    catch (error){
      addAlert(`${error}`, 'error', false);
      if(!queries.length) {
        setIsTerminalEnabled(false);
      }
      setIsNewQuery(true);
    }
  }, [queryData]);

  const handleDoubleClick = (index: number) => {
    setIsEditableIndex(index);
    if (!isWarningShown) {
      addAlert("Any changes in the code won't be validated", 'warning', true);
      setIsWarningShown(true);
    }
  };

  const handleBlur = (index: number) => {
    setIsEditableIndex(null);
  };

  const addQuery = () => {
    setQueries([...queries]);
    setIsNewQuery(true);
  };

  const addUnionQuery = () => {
    const newQueries = [...queries];
    newQueries[newQueries.length - 1] = newQueries[newQueries.length - 1].replace(/;$/, '');
    newQueries.push('UNION');
    setQueries(newQueries);
    setIsNewQuery('union');
  };

  const removeQuery = (index: number) => {
    const query = queries[index];
    let updatedQueries = queries.filter((_, i) => i !== index);
    if ( query === 'UNION' ) {
      updatedQueries[index-1] = updatedQueries[index-1]+';'
      setIsNewQuery('removeUnion');
    } else if (updatedQueries[index] === 'UNION') {
      if (isNewQuery === 'union') setIsNewQuery('removeUnion');
      updatedQueries = updatedQueries.filter((_, i) => i !== index);
    }
    if(!updatedQueries.length) {
      if (!isNewQuery) setIsNewQuery(true);
      setIsTerminalEnabled(false);
    }
    setQueries(updatedQueries);
  };

  const updateQuery = (index: number, value: string) => {
    const updatedQueries = [...queries];
    updatedQueries[index] = value;
    setQueries(updatedQueries);
  };

  const renderQueries = () => {
    return queries.map((query, index) => (
      <div key={index} className="relative flex items-center mb-3">
        <button onClick={() => removeQuery(index)} className="bg-gray-700 text-white p-2 w-10 h-10 rounded-full hover:bg-gray-600 z-10"><FontAwesomeIcon icon={faTrash}/></button>
        <div className="flex-1 h-full p-2 ml-3 overflow-hidden">
          <div
              onDoubleClick={query !== "UNION" ? () => handleDoubleClick(index) : undefined}
              className="w-full h-fit relative font-mono"
          >
            <SyntaxHighlighter language="sql" style={vscDarkPlus} wrapLines={true} lineProps={{style: {whiteSpace: 'pre-wrap'}}}>
              {(query[query.length - 1] === '\n' ? query + ' ' : query) || ' '}
            </SyntaxHighlighter>
            {isEditableIndex === index ? (
              <textarea
                value={query}
                onChange={(e) => updateQuery(index, e.target.value)}
                className="absolute inset-0 resize-none bg-transparent p-[1em] caret-white text-[13px] text-transparent"
                readOnly={isEditableIndex !== index}
                onBlur={() => handleBlur(index)}
              />
            ) : ''}
          </div>
        </div>
      </div>
    ));
  };

  const saveQueriesToFile = () => {
    const fileName = `${pageName}.sql`;
    const fileContent = queries.join('\n');
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  return (
    <div className="relative bg-gray-800 flex flex-row h-fit">
      {isTerminalEnabled && (
        <button onClick={toggleTerminal} className={`absolute z-[49] top-0 right-1/2 transform h-7 w-10 px-1 ${isTerminalCollapsed ? 'rounded-t-lg -translate-y-full text-gray-600' : 'rounded-b-lg text-white'} hover:text-gray-500`}>
          <FontAwesomeIcon aria-hidden="true" icon={isTerminalCollapsed ? faChevronUp : faChevronDown} />
        </button>
      )}
      <div className={`${isTerminalEnabled ? 'h-fit' : 'hidden'} flex flex-row relative w-full`}>
        <div className={`relative text-white w-full align-middle transition-all ease-in-out ${isTerminalCollapsed ? 'h-0 opacity-0 invisible' : 'h-80 opacity-100 visible'}`}>
          <div className='bg-gray-950 h-fit w-full flex flex-row justify-between'>
            <div className='pl-4 flex items-center w-1/5'>
              <FontAwesomeIcon icon={faFilePen}/>
              <div className="p-2 w-full h-fit relative focus:bg-gray-900">
                <span className="text-gray-300">{pageName}.sql</span>
                <textarea
                  value={`${pageName}`}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const forbiddenCharacters = /[<>:"\/\\|?*\x00-\x1F]/g;
                    const newPageName = inputValue.replace(forbiddenCharacters, '');
                    setPageName(newPageName)}}
                  maxLength={20}
                  className="absolute w-full inset-0 resize-none bg-transparent p-2 caret-white text-transparent"
                />
              </div>
            </div>
            <div className='flex flex-row h-full align-middle'>
              <button className='text-white p-2 mx-5 hover:text-gray-400' onClick={saveQueriesToFile}><FontAwesomeIcon icon={faSave} /></button>
            </div>
          </div>
          <div className="p-5 w-full h-[15rem] flex-1 overflow-scroll">
            {queries.length > 0 && renderQueries()}
            <div>
              {(queries[queries.length - 1] !== 'UNION' && (!isNewQuery && isNewQuery !== 'removeUnion')) && <button onClick={addQuery} className="bg-gray-700 text-white  mr-5 p-2 w-10 h-10 rounded-full hover:bg-gray-600"><FontAwesomeIcon icon={faPlus}/></button>}
              {(queries.length > 0 && queries[queries.length - 1].startsWith('SELECT')) && <button onClick={addUnionQuery} className="bg-gray-700 text-white p-2 w-fit h-10 rounded-xl hover:bg-gray-600">UNION</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );  
};

export default Terminal;
