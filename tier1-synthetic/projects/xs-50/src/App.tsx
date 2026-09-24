import { Suspense } from 'react';

import AuthStepper from './features/auth/AuthStepper';
import AuthHeatmap from './features/auth/AuthHeatmap';
import AuthFeed from './features/auth/AuthFeed';
import AuthTextArea from './features/auth/AuthTextArea';
import AuthDonut from './features/auth/AuthDonut';
import './App.css';



function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>TaskBoard</h1>
      </header>
      <main className="main">
        <AuthStepper />
        <AuthHeatmap />
        <AuthFeed />
        <AuthTextArea />
        <AuthDonut />
      </main>
    </div>
  );
}

export default App;
