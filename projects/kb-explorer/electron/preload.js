const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kbApi', {
  readAll: () => ipcRenderer.invoke('kb:readAll'),
  readAllAI: () => ipcRenderer.invoke('kb:readAllAI')
});
