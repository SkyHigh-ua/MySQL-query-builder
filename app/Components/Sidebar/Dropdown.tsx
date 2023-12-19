interface DropdownProps {
    label?: string;
    options: string[];
    values: string[];
    selected?: string;
    onChange: (e: any) => any;
    error?: boolean;
    errorMessage?: string;
  }
  
export const Dropdown = ({ label, options, values, selected, onChange, error, errorMessage }: DropdownProps) => {
    return (
      <div className="relative">
        {label && <label className="font-medium">{label}</label>}
        <select
          className={`appearance-none block w-full bg-gray-800 border text-white ${(!error && error !== undefined) ? 'border-red-500' : 'border-gray-950'} rounded-md py-2 px-3 mb-1 leading-tight focus:outline-none focus:bg-gray-900`}
          onChange={onChange}>
          {options.map((option, index) => (
            <option value={values[index]} defaultValue={selected === undefined ? selected : ''}>{option}</option>
          ))}
        </select>
        {(!error && error !== undefined) && <p className="text-red-500 text-xs italic">{errorMessage}</p>}
        <div className="pointer-events-none absolute top-4 bottom-0 right-0 flex items-center px-2 text-white">
          <i className="fa-solid fa-caret-down"></i>
        </div>
      </div>
    );
};