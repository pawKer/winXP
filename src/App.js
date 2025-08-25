import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  useLocation,
} from 'react-router-dom';

import WinXP from 'WinXP';
import { useGA } from 'hooks';

const AppContent = () => {
  const location = useLocation();
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  useGA(measurementId, location.pathname);

  return (
    <Switch>
      <Route
        path="/notes/guitar-parts"
        component={() => <WinXP defaultPath="/notes/guitar-parts" />}
      />
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
