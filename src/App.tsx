import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

const { myAPI } = window;

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [buttonBusy, setButtonBusy] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button disabled={buttonBusy} onClick={async () => {
          setButtonBusy(true);
          const files = await myAPI.openDialog();
          if (Array.isArray(files)) {
            setFiles(files);
          } else {
            setFiles([]);
          }
          setButtonBusy(false);
        }} data-testid="open-dialog">open dialog</button>
        <ul>
          {files.map((file, index) => (
            <li key={file} data-testid={`file${index}`}>{file}</li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
