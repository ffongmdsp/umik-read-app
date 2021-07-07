// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')
let browserWin = null;

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  browserWin = mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  browserWin = null;
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
var portAudio = require('naudiodon');

console.log(portAudio.getDevices());

const { ipcMain } = require('electron');
const fs = require('fs');
const { time } = require('console');

let ofStream = null;
let aiStream = null;
let recStartTimeStamp = -1;

ipcMain.on('start-record', () => {
  console.log("Starting recording...");
  openMicToRecordToFile('./umik_data.raw');
});

ipcMain.on('stop-record', () => {
  console.log("Stopping recording...");
  aiStream.quit();
});


function openMicToRecordToFile(outfilePath)
{
  let audioDevices = portAudio.getDevices();
  // find UMIK
  let umik = audioDevices.find( (ad) => (ad.name.includes('UMIK')));

  if (umik) {
    console.log("UMIK found: ", umik);
    ofStream = fs.createWriteStream(outfilePath, {
      flags: 'w',  
    });
    ofStream.on('finish', () => {
      console.log('ofstream is ended');
      // destroy it
      ofStream.destroy();
    });
    ofStream.on('close', () => {
      console.log('ofstream is closed');
      ofStream = null;
      browserWin.webContents.send('state-changed', 'Stopped');
    });

    aiStream = new portAudio.AudioIO({
      inOptions: {
        channelCount: umik.maxInputChannels >= 2? 2 : 1,
        sampleFormat: portAudio.SampleFormat16Bit,
        sampleRate: 48000,
        deviceId: umik.id,
        closeOnError: true
      }
    });
    if (aiStream) {
      aiStream.on('data', (buf) => {
        console.log(`${buf.timestamp}: ${buf.length} audio data read`);
        if (recStartTimeStamp < 0) {
          recStartTimeStamp = buf.timestamp;
          browserWin.webContents.send('state-changed', 'Recording');
        }
        else {
          const elapsedTime = buf.timestamp - recStartTimeStamp;
          browserWin.webContents.send('duration-changed', elapsedTime);
        }
      })
      aiStream.on('error', (err) => {
        console.log(`Audio Input Stream Error: ${err}`);
        // close-on-error is set
      });
      aiStream.on('close', () => {
        console.log(`Audio Input Stream closed`);
        aiStream = null;
      });
    }
    aiStream.pipe(ofStream);
    recStartTimeStamp = -1;
    aiStream.start();
  }
  else {
    console.error('Cannot find UMIK');
  }
}