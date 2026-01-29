import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  useLocation,
} from 'react-router-dom';

import WinXP from 'WinXP';
import { useGA } from 'hooks';
import { getAllNotes } from 'WinXP/apps/notesConfig';

const AppContent = () => {
  const location = useLocation();
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  useGA(measurementId, location.pathname);

  const notes = getAllNotes();

  return (
    <Switch>
      {notes.map(note => (
        <Route
          key={note.id}
          path={note.path}
          component={() => <WinXP defaultPath={note.path} />}
        />
      ))}
      <Route path="/" component={() => <WinXP defaultPath="/" />} />
    </Switch>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
