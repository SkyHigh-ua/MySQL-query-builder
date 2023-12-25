interface QueryInputProps {
    label: string;
    placeholder: string;
    onChange: (e: any) => any;
    value?: string | number;
    error?: boolean;
    errorMessage?: string;
    type?: string;
  }
  
export const QueryInput = ({ label, placeholder, onChange, value, error, errorMessage, type }: QueryInputProps ) => (
    <>
      <label className="font-medium">{label}
      <input className={`appearance-none block w-full bg-gray-800 border text-white ${(!error && error !== undefined) ? 'border-red-500' : 'border-gray-950'} rounded-md py-2 px-3 mb-1 leading-tight focus:outline-none focus:bg-gray-900`} 
        type={type ? type : "text"} 
        value={value && typeof value === 'string' && type ? parseInt(value) : value !== undefined ? value : ''}
        placeholder={placeholder} 
        maxLength={64}
        onChange={onChange} /></label>
      {(!error && error !== undefined) && <p className="text-red-500 text-xs italic">{errorMessage}</p>}
    </>
);