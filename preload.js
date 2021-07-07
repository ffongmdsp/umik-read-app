// preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })
  

  const { ipcRenderer, contextBridge } = require("electron");

  contextBridge.exposeInMainWorld(
    "electron",
    {
      request_start_record: () => {
        ipcRenderer.send('start-record');
      },

      request_stop_record: () => {
        ipcRenderer.send('stop-record');
      }
    });

    console.log('Preload running');

    ipcRenderer.on('state-changed', (event, newState) => {
      console.log('Here state changed');
      document.getElementById('state_val').innerText = newState;
    });

    ipcRenderer.on('duration-changed', (event, newDuration) => {
      document.getElementById('duration_val').innerText = newDuration;
    });
  
