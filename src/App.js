import React from 'react';
import { useGA } from 'hooks';
import WinXP from 'WinXP';

const App = () => {
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  useGA(measurementId);
  return <WinXP />;
};

export default App;
