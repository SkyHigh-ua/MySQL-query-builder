import { FC, useContext, useEffect, useState } from "react";
import { QueryProps } from "../../Interfaces/Query";
import { ProjectContext } from "../../context/ProjectContext"; 
import { Field } from "../../Interfaces/Table";
import { Button } from './Button';
import { QueryInput } from "./QueryInput";
import { Dropdown } from "./Dropdown";
import { isValidDataType, isValidFieldData, isValidName, isValidWhereClause } from "../../functions/Validation";

interface FormOptionsProps {
    options: QueryProps | null; 
    setOptions: React.Dispatch<React.SetStateAction<QueryProps | null>>; 
    queryType: string;
}

export const FormOptions: FC<FormOptionsProps> = ( { options, setOptions, queryType } ) => {
    const { selectedTable, selectedFields } = useContext(ProjectContext);

    const [fields, setFields] = useState([true]);
    const [groupByFields, setGroupByFields] = useState<string[]>([]);

    useEffect(() => {
      if (queryType === 'select') setGroupByFields(['', ...selectedFields.filter((sf, si) => {
        if (!options?.fieldsData || si >= options?.fieldsData?.length) return true;
        const fieldData = options && options.fieldsData?.find((fd, di) => di === si);
        return !fieldData || !fieldData?.func;
      }).map(field => field.field.name)]);
    }, [selectedFields, options]);

    const addField = () => {
      setFields([...fields, true]);
    };

    const removeField = (index: number) => {
      const newFields = fields.filter((_, i) => i !== index);
      setFields(newFields);
    };

    const addAlterField = () => {
      if (options === null || options.fieldsData === undefined) {
        setOptions((oldOptions) => ({ ...oldOptions, fieldsData: [{}] }));
      } else {
        const pushFieldsData = [...options.fieldsData];
        pushFieldsData.push({action: "add"});
        setOptions((oldOptions) => ({ ...oldOptions, fieldsData: pushFieldsData }));
      }
    };

    const removeAlterField = (index: number) => {
      if (options === null || options.fieldsData === undefined) {
        setOptions((oldOptions) => ({ ...oldOptions, fieldsData: [{}] }));
      } else {
        const fieldsData = [...options.fieldsData];
        if(fieldsData[index].action !== 'add') {
          setOptions((oldOptions) => ({ ...oldOptions, fieldsData: fieldsData.map((field, i) => {
            if (i === index) return {...field, action: "remove"};
            return field;
          }) }));
        } else {
          console.log(fieldsData.filter((field, i) => i === index))
          setOptions((oldOptions) => ({ ...oldOptions, fieldsData: fieldsData.filter((field, i) => i !== index) }));
        }
      }
    };

    const handleOptionChange = (optionType: string, value: any, fieldType?: string, index?: number, dataName?: string) => {
      if (value === '') value = undefined;
      if(!fieldType) {
          setOptions((oldOptions) => ({ ...oldOptions, [optionType]: value }));
      } else {
        if ( index === undefined ){
          throw new Error('Not all argument received')
        }
        let newFieldData = options?.fieldsData ? options.fieldsData : [];
        while (index >= newFieldData.length) {
          newFieldData.push({});
        } 
        if (dataName){
          newFieldData[index] = { ...newFieldData[index], [fieldType]: { name: dataName, value: value} };
        } else {
          if(['unique', 'notNull', 'autoIncrement', 'default'].includes(fieldType)) newFieldData[index] = { ...newFieldData[index], constraints: { ...{
            unique: newFieldData[index].constraints?.unique ? true : false, 
            notNull: newFieldData[index].constraints?.notNull ? true : false, 
            autoIncrement: newFieldData[index].constraints?.autoIncrement ? true : false, 
            default: newFieldData[index].constraints?.default}, 
            [fieldType]: value } };
          else newFieldData[index] = { ...newFieldData[index], [fieldType]: value };
          if(!newFieldData[index].action && queryType === 'edit') newFieldData[index] = { ...newFieldData[index], action: 'modify' };
        }
        setOptions((oldOptions) => ({ ...oldOptions, fieldsData: newFieldData }));
      }
    };

    switch(queryType) { 
      case "select": {
        return (
          <div className="flex flex-col">
            <label><input className="mr-2" type="checkbox" onChange={(e) => handleOptionChange('distinct', e.target.checked)} /> DISTINCT</label>
            <QueryInput label="WHERE" placeholder="Condition" value={options?.where} error={options?.where ? isValidWhereClause({whereClause: options?.where, fields: selectedFields}) : true} errorMessage="Where clause is incorrect." onChange={(e) => handleOptionChange('where', e.target.value)}/>
            <Dropdown label="ORDER BY" 
                  options={['', ...selectedFields.map(field => field.field.name)]} 
                  values={['', ...selectedFields.map(field => field.field.name)]} 
                  selected={options?.orderBy ? options.orderBy : ''}
                  onChange={(e) => handleOptionChange('orderBy', e.target.value)}
                  />
            <QueryInput label="LIMIT" placeholder="" value={options?.limit} error={!(options?.limit && options?.limit <= 0)} errorMessage="Limit value is incorrect." onChange={(e) => handleOptionChange('limit', e.target.value)} type='number'/>
            {
              selectedFields && selectedFields.map((field, index) => (
                <Dropdown key={`${field.schema}.${field.table}.${field.field.name}`} label={`Function for ${field.schema}.${field.table}.${field.field.name}`} 
                  options={[`${field.field.name}`, `SUM(${field.field.name})`, `AVG(${field.field.name})`, `COUNT(${field.field.name})`, `MAX(${field.field.name})`, `MIN(${field.field.name})`]} 
                  values={['', 'SUM', 'AVG', 'COUNT', 'MAX', 'MIN']} 
                  selected={options?.fieldsData && options.fieldsData[index] ? options.fieldsData[index].func : ''}
                  onChange={(e) => handleOptionChange('fieldsData', e.target.value, 'func', index)}/>))
            }
            <Dropdown label="GROUP BY" 
                  options={groupByFields} 
                  values={groupByFields} 
                  selected={options?.groupBy ? options.groupBy : ''}
                  onChange={(e) => handleOptionChange('groupBy', e.target.value)}/>
          </div>
        );
      } 
      case "insert": { 
        return (
          <div className="flex flex-col overflow-scroll">
            {selectedTable && (<> 
                {selectedTable.data.fields.map((field: Field, index: number) => (
                <QueryInput key={`insert-${field.name}`} label={field.name} placeholder="Data" value={(options?.fieldsData && options.fieldsData[index]) && options?.fieldsData[index].data?.value} error={isValidFieldData(options?.fieldsData ? options.fieldsData[index]?.data?.value : undefined, field.type, field.constraints?.notNull)} errorMessage="Data is incorrect." onChange={(e) => handleOptionChange('fieldsData', e.target.value, 'data', index, `${field.name}`)}/>
                ))}
             </>)}
          </div>
        );
      } 
      case "update": { 
        return (
          <div className="flex flex-col overflow-scroll">
            {selectedTable && (<> 
                {selectedTable.data.fields.map((field: Field, index: number) => (
                <QueryInput key={`update-${field.name}`} label={field.name} placeholder="Data" value={(options?.fieldsData && options.fieldsData[index]) && options?.fieldsData[index].data?.value} error={isValidFieldData(options?.fieldsData ? options.fieldsData[index]?.data?.value : undefined, field.type, field.constraints?.notNull)} errorMessage="Data is incorrect." onChange={(e) => handleOptionChange('fieldsData', e.target.value, 'data', index, `${field.name}`)}/>
                ))}
                <QueryInput label="WHERE" placeholder="Condition" value={options?.where} error={isValidWhereClause({whereClause: options?.where, table: selectedTable.data})} errorMessage="Where clause is incorrect." onChange={(e) => handleOptionChange('where', e.target.value)}/>
             </>)}
          </div>
        );
      } 
      case "delete": { 
        return (
          <div className="flex flex-col">
            {selectedTable && (
              <QueryInput label="WHERE" placeholder="Condition" value={options?.where} error={isValidWhereClause({whereClause: options?.where, table: selectedTable.data})} errorMessage="Where clause is incorrect." onChange={(e) => handleOptionChange('where', e.target.value)}/>
              )}
          </div>
        );
      } 
      case "create": { 
        return (
          <div className="flex flex-col overflow-scroll">
            <QueryInput label="Schema" placeholder="Schema name" value={options?.schema} error={!options?.schema || isValidName(options?.schema)} errorMessage="Schema name is incorrect." onChange={(e) => handleOptionChange('schema', e.target.value)}/>
            <QueryInput label="Title" placeholder="Table title" value={options?.title} error={!options?.title || isValidName(options?.title)} errorMessage="Table title is incorrect." onChange={(e) => handleOptionChange('title', e.target.value)}/>
            {fields.map((field, index) => (
              <>
                <div className="flex flex-row">
                  {index > 0 && (<div className="flex items-center mr-1">
                    <Button label="-" onClick={() => removeField(index)} type="form_remove"/>
                  </div>)}
                  <div className="flex flex-col">
                    <QueryInput label="Field" placeholder="Field name" value={options?.fieldsData ? options.fieldsData[index]?.name : undefined} error={isValidName(options?.fieldsData ? options.fieldsData[index]?.name : undefined)} errorMessage="Field name is incorrect." onChange={(e) => handleOptionChange('fieldsData', e.target.value, 'name', index)}/>
                    <QueryInput label="Field Type" placeholder="Field type" value={options?.fieldsData ? options.fieldsData[index]?.type : undefined} error={isValidDataType(options?.fieldsData ? options.fieldsData[index]?.type : undefined)} errorMessage="Field type is incorrect." onChange={(e) => handleOptionChange('fieldsData', e.target.value, 'type', index)}/>
                    <label><input className="bg-gray-800 mr-2" type="checkbox" onChange={(e) => handleOptionChange('fieldsData', e.target.checked, 'notNull', index)} /> NOT NULL</label>
                    <label><input className="mr-2" type="checkbox" onChange={(e) => handleOptionChange('fieldsData', e.target.checked, 'unique', index)} /> UNIQUE</label>
                    <label><input className="mr-2" type="checkbox" onChange={(e) => handleOptionChange('fieldsData', e.target.checked, 'isPK', index)} /> PK</label>
                    <label><input className="mr-2" type="checkbox" disabled={!options?.fieldsData || options.fieldsData[index]?.isPK !== true} onChange={(e) => handleOptionChange('fieldsData', e.target.checked, 'autoIncrement', index)} /> AUTO INCREMENT</label>
                    <QueryInput label="DEFAULT" placeholder="" value={options?.fieldsData && options.fieldsData[index]?.constraints?.default} error={isValidFieldData(options?.fieldsData && options.fieldsData[index]?.constraints?.default, options?.fieldsData && options.fieldsData[index]?.type, options?.fieldsData && options.fieldsData[index]?.constraints?.notNull)} errorMessage="Default statement is incorrect." onChange={(e) => handleOptionChange('fieldsData', e.target.value, 'default', index)}/>
                  </div>
                </div>
                {index+1 < fields.length && <hr className="bg-white border rounded w-full h-[2px] my-2" />} 
              </>
            ))}
            <Button label="+" onClick={addField} type="form_add"/>
          </div>
        );
      } 
      case "edit": { 
        return (
          <div className="flex flex-col overflow-scroll">
            <QueryInput label="Schema" placeholder="Schema name" value={options?.schema} error={isValidName(options?.schema)} errorMessage="Schema name is incorrect." onChange={(e) => handleOptionChange('schema', e.target.value)}/>
            <QueryInput label="Title" placeholder="Table title" value={options?.title} error={isValidName(options?.title)} errorMessage="Table title is incorrect." onChange={(e) => handleOptionChange('title', e.target.value)}/>
            {options?.fieldsData && options.fieldsData.map((field, index) => (field.action !== 'remove' &&
              <>
                <div className="flex flex-row">
                  {index > 0 && (<div className="flex items-center mr-1">
                    <Button label="-" onClick={() => removeAlterField(index)} type="form_remove"/>
                  </div>)}
                  <div className="flex flex-col">
                    <QueryInput label="Field" placeholder="Field name" value={field.name} error={isValidName(options?.fieldsData ? options.fieldsData[index]?.name : undefined)} errorMessage="Field name is incorrect." onChange={(e) => handleOptionChange('fieldsData', e.target.value, 'name', index)}/>
                    <QueryInput label="Field Type" placeholder="Field type" value={field.type} error={isValidDataType(options?.fieldsData ? options.fieldsData[index]?.type : undefined)} errorMessage="Field type is incorrect." onChange={(e) => handleOptionChange('fieldsData', e.target.value, 'type', index)}/>
                    <label><input className="mr-2" type="checkbox" checked={field.constraints?.notNull} onChange={(e) => handleOptionChange('fieldsData', e.target.checked, 'notNull', index)} /> NOT NULL</label>
                    <label><input className="mr-2" type="checkbox" checked={field.constraints?.unique} onChange={(e) => handleOptionChange('fieldsData', e.target.checked, 'unique', index)} /> UNIQUE</label>
                    <label><input className="mr-2" type="checkbox" checked={field.isPK} onChange={(e) => handleOptionChange('fieldsData', e.target.checked, 'isPK', index)} /> PK</label>
                    <label><input className="mr-2" type="checkbox" checked={field.constraints?.autoIncrement && field.isPK} disabled={!field.isPK} onChange={(e) => handleOptionChange('fieldsData', e.target.checked, 'autoIncrement', index)} /> AUTO INCREMENT</label>
                    <QueryInput label="DEFAULT" placeholder="" value={field.constraints?.default ? field.constraints?.default : ''} error={isValidFieldData(options?.fieldsData && options.fieldsData[index]?.constraints?.default, options?.fieldsData && options.fieldsData[index].type, options?.fieldsData && options.fieldsData[index].constraints?.notNull)} errorMessage="Default statement is incorrect." onChange={(e) => handleOptionChange('fieldsData', e.target.value, 'default', index)}/>
                  </div>
                </div>
                {(options?.fieldsData && index+1 < options.fieldsData.length) && <hr className="bg-white border rounded w-full h-[2px] my-2" />} 
              </>
            ))}
            <Button label="+" onClick={addAlterField} type="form_add"/>
          </div>);
      } 
      case "drop": { 
        return (<label>CHOSE TABLE TO DROP</label>);
      } 
      default: { 
         return null;
      } 
    };
  };