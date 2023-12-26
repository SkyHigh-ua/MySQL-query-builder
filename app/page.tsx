'use client'

import React, { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { ERDiagram } from './components/ERDiagram/ERDiagram';
import { Sidebar } from './components/Sidebar/Sidebar';
import { DialogWindow } from './components/DialogWindow';
import Terminal from './components/Terminal';
import { AlertList } from './components/Alert/AlertList';

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <ProjectProvider>
      <AlertList />
      {isDialogOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50 z-50 flex justify-center items-center">
          <DialogWindow onClose={handleDialogClose} />
        </div>
      )}
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex">
          <Sidebar tabIndex={isDialogOpen ? -1 : 0}/>
          <div className="flex-1 flex flex-col w-4/5">
            <ERDiagram />
            <Terminal />
          </div>
        </div>
      </div>
    </ProjectProvider>
  );
}
