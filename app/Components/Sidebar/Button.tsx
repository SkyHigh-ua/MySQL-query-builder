interface ButtonProps {
    label: string;
    onClick: () => any;
    type: string;
    tabIndex?: number;
  }
  
export const Button = ({ label, onClick, type, tabIndex }: ButtonProps ) => {
    const styles = {
      main_full: "bg-blue-500 text-white p-2 w-full rounded-md hover:bg-blue-600 mb-2",
      main: "bg-blue-500 text-white p-2 w-fit rounded-md hover:bg-blue-600 mb-2",
      sub: "bg-gray-900 text-white p-2 w-fit rounded-md hover:bg-gray-700 mb-2",
      form_add: "bg-gray-950 text-white p-2 w-full rounded-md hover:bg-gray-700 mb-2",
      form_remove: "bg-gray-950 text-white h-7 w-7 rounded-full hover:bg-gray-700 mr-2",
    };
    const style = styles[type as keyof typeof styles];
  
    return (
    <button className={style} onClick={onClick} tabIndex={tabIndex || 0}>
      {type === 'form_remove' ? <i className="fa-solid fa-minus"></i> : label}
    </button>
    )
};
  