import { useContext } from 'react';
import { ProjectContext } from '../../context/ProjectContext';
import Alert from './Alert';

export const AlertList: React.FC = () => {
    const { alerts, setAlerts }  = useContext(ProjectContext);

    const dismissAlert = (id: number) => {
        setAlerts(currentAlerts => currentAlerts.filter(alert => alert.id !== id));
    };

    return (
        <div className="fixed top-5 right-5 z-50 max-w-xs">
            <div className='flex flex-col space-y-2'>
                <div className="mt-4 overflow-auto max-h-96">
                    {alerts.map(alert => (
                    <Alert key={alert.id} id={alert.id} message={alert.message} type={alert.type} dismissible={alert.dismissible} onDismiss={dismissAlert} />
                    ))}
                </div>
            </div>
        </div>
    );
};