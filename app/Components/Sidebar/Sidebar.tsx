import React, { useState, useContext, useEffect } from 'react';
import { ProjectContext } from '../../context/ProjectContext';
import { Index, Table } from '../../Interfaces/Table';
import { Query, QueryProps } from '../../Interfaces/Query';
import { FormOptions } from './FormOptions';
import { Button } from './Button';
import { StepIndicator } from './StepIndicator';
import { isTableAltered, validateOptions } from '../../functions/Validation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export const Sidebar = ({ tabIndex }: {tabIndex: number}) => {
  const { nodes, selectedTable, selectedFields, setSelectedFields, setQueryData, setSelectedTable, setIsTerminalEnabled, isNewQuery, setIsNewQuery, selectable, setSelectable, addAlert, handleAddTable, handleEditTable, handleRemoveTable } = useContext(ProjectContext);
  const [step, setStep] = useState(1);
  const [maxSteps, setMaxSteps] = useState(1);
  const [isUnion, setIsUnion] = useState(false);
  const [steps, setSteps] = useState(['query']);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [queryType, setQueryType] = useState<string>('select');
  const [options, setOptions] = useState<QueryProps | null>(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const goToNextStep = () => {
    if (step === maxSteps && maxSteps !== 1) {
      const [validationResult, validationMessage] = validateOptions(options, queryType, selectedFields, selectedTable?.data);
      if (validationResult) {
        if (queryType === 'edit' && selectedTable && options) {
          if (!isTableAltered(selectedTable.data, options)) {
            addAlert("Make changes in the table before submitting.", "error", false);
            return;
        }};
        setStep(step + 1);
        toggleSidebar();
        handleSubmit();
      } else {
        addAlert(validationMessage, "error", false);
      }
    } else if (step < maxSteps + 1) {
      setStep(step + 1);
      if (isSidebarCollapsed) toggleSidebar();
    };
  };

  const goToPreviousStep = () => {
      if (isNewQuery){
        if (step === 1) {
          setMaxSteps(1);
          if(selectedFields.length) setSelectedFields([]);
          if(selectedTable) setSelectedTable(null);
        };
        if (selectable && steps[step - 1] === 'query') setSelectable('');
        setStep(step - 1);
        if (isSidebarCollapsed) toggleSidebar();
      }
  };

  useEffect(() => {
    if(queryType === 'edit' && selectedTable && isNewQuery) {
      setOptions({title: selectedTable?.data.title, schema: selectedTable?.data.schema, index: selectedTable.data.index, fieldsData: selectedTable?.data.fields});
    } else if ( step > 2 && !selectedTable && queryType !== 'select' ) goToPreviousStep();
  }, [selectedTable]);

  useEffect(() => {
    if(!selectedFields.length && steps[step-1] === 'form' && queryType === 'select' && isNewQuery) goToPreviousStep();
  }, [selectedFields]);

  useEffect(() => {
    if(isNewQuery && (typeof isNewQuery !== 'string' || isNewQuery === 'removeUnion')) {
      setStep(1);
      setMaxSteps(1);
      setSteps(['query']);
      setIsSidebarCollapsed(false);
    }
    if(isNewQuery === 'union') {
      setIsUnion(true);
      setStep(2);
      handleQueryTypeChange('select');
      setIsSidebarCollapsed(false);
    }
    if(isNewQuery === 'removeUnion'){
      setIsUnion(false);
    }
  }, [isNewQuery]);

  useEffect(() => {
    if(steps[step-1] === 'selection' && (selectable === 'fields' ? selectedFields.length : selectedTable)) {
      goToNextStep();
    }
  }, [selectedTable, selectedFields]);

  // useEffect(() => {
  //   if(nodes.length === 0) {
  //     handleQueryTypeChange('create');
  //   } else {

  //   }
  // }, [nodes]);

  const handleSubmit = () => {
    setIsNewQuery(false);
    if (isUnion) setIsUnion(false);
    if (queryType !== 'drop') {
      const queryData: Query = {
        type: queryType,
        props: options === null ? {} : options,
      };
      setQueryData(queryData);
    }
    setIsTerminalEnabled(true);
    setSelectable('');
    if (queryType === 'create') {
      addNewTable();
    } else if (queryType === 'edit') {
      editExistingTable();
    } else if (queryType === 'drop' && selectedTable) {
      handleRemoveTable(selectedTable);
      setSelectedTable(null);
    }
  };

  const addNewTable = () => {
    if (options?.title && options?.schema && options?.fieldsData) {
      const fields = options.fieldsData.map((field, index) => ({
        name: field.name || "undefined",
        type: field.type || "undefined",
        isPK: field.isPK,
        isFK: field.isFK,
        references: field.references,
        constraints: field.constraints,
      }))
      const newTableData: Table = {
        title: options?.title,
        schema: options?.schema,
        fields: fields,
      };
      handleAddTable(newTableData);
    } else {
      throw new Error('Not enough data provided to add new table')
    }
  };

  const editExistingTable = () => {
    if (selectedTable) {
      if (options?.title && options?.schema && options?.fieldsData) {
        const fieldsToRemove = options.fieldsData
          .filter(fieldData => fieldData.action === 'remove')
          .map(fieldData => fieldData.name);
        const index = selectedTable.data.index.filter((index: Index) => !index.fields.every(field => fieldsToRemove.includes(field)));
        const newFieldData = options.fieldsData.filter((field, i) => field.action !== 'remove');
        const fields = newFieldData.map((field, index) => ({
          name: field.name || "undefined",
          type: field.type || "undefined",
          isPK: field.isPK,
          isFK: field.isFK,
          references: field.references,
          constraints: field.constraints,
        }))
        const updatedTableData: Table = {
          title: options?.title,
          schema: options?.schema,
          fields: fields,
          index: index,
        };
        handleEditTable(selectedTable, updatedTableData);
      } else {
        throw new Error('Not enough data provided to edit table')
      }
    } else {
      throw new Error('Table isn\'t selected');
    }
  };

  const handleQueryTypeChange = (type: string) => {
    setSelectedTable(null);
    setSelectedFields([]);
    setQueryType(type);
    setOptions(null);
    ['create', 'drop'].includes(type) ? setMaxSteps(2) : setMaxSteps(3);
    type === 'drop' ? setSteps(['query', 'selection']) : type === 'create' ? setSteps(['query', 'form']) : setSteps(['query', 'selection', 'form'])
    type === 'select' ? setSelectable('fields') : ['create', 'drop'].includes(type) ? setSelectable('') : setSelectable('table');
    goToNextStep();
  };

  return (
    <div className='bg-gray-900 border-r-4 border-gray-900 flex flex-row w-fit h-screen relative'>
      <StepIndicator currentStep={step} totalSteps={maxSteps} stepNames={steps}/>
      <div className={`bg-gray-800 text-white transition-all ease-in-out ${isSidebarCollapsed ? 'p-0 w-0 opacity-0 invisible' : 'p-5 w-80 opacity-100 visible'} h-full flex flex-col overflow-y-auto justify-between`}>
        {steps[step-1] === 'query' && <div className="flex flex-col items-center">
          <Button label='CREATE TABLE' onClick={() => handleQueryTypeChange("create")} type='main_full' tabIndex={tabIndex}/>
          <Button label='DROP TABLE' onClick={() => handleQueryTypeChange("drop")} type='main_full' tabIndex={tabIndex}/>
          <Button label='ALTER TABLE' onClick={() => handleQueryTypeChange("edit")} type='main_full' tabIndex={tabIndex}/>
          <Button label='SELECT' onClick={() => handleQueryTypeChange("select")} type='main_full' tabIndex={tabIndex}/>
          <Button label='INSERT' onClick={() => handleQueryTypeChange("insert")} type='main_full' tabIndex={tabIndex}/>
          <Button label='UPDATE' onClick={() => handleQueryTypeChange("update")} type='main_full' tabIndex={tabIndex}/>
          <Button label='DELETE' onClick={() => handleQueryTypeChange("delete")} type='main_full' tabIndex={tabIndex}/>
        </div>}
        {(steps[step-1] === 'selection') && <div className="h-full flex flex-col items-center justify-center">
          <label className='font-bold'>{`Select a table${queryType === 'select' ? ' fileds' : ''}`}</label> 
        </div>}
        {steps[step-1] === 'form' && <div className="flex flex-col">
          <FormOptions options={options} setOptions={setOptions} queryType={queryType} />
        </div>}
        {(step !== 1) && <div className="flex justify-between p-2 mt-4">
          {((!isUnion && steps[step-1] === 'selection') || (steps[step-1] === 'form' && queryType === 'create' && nodes.length > 0)) && <Button label={'Previous'} onClick={() => goToPreviousStep()} type={queryType === 'create' ? 'sub' : 'main_full'}/>}
          {(steps[step-1] === 'form') && <Button label={'Generate Query'} onClick={() => goToNextStep()} type={queryType === 'create' && nodes.length > 0 ? 'main' : 'main_full'}/>}
        </div>}
      </div> 
      {(step !== maxSteps + 1 || step === 1) && <button onClick={toggleSidebar} className="absolute z-[49] right-0 bottom-0 top-0 my-auto transform translate-x-full h-10 w-10 p-1 text-gray-600 mx-2 hover:text-gray-800">
        <FontAwesomeIcon aria-hidden="true" icon={isSidebarCollapsed ? faChevronRight : faChevronLeft} />
      </button>}
    </div>
  );
};