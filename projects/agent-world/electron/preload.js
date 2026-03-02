const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agentWorld', {
  // Agent file operations
  readDirectives: (agentTypeId) => ipcRenderer.invoke('agent:readDirectives', agentTypeId),
  readAllDirectives: () => ipcRenderer.invoke('agent:readAllDirectives'),
  writeDirectives: (agentTypeId, content) => ipcRenderer.invoke('agent:writeDirectives', agentTypeId, content),
  getAgentsDir: () => ipcRenderer.invoke('agent:getAgentsDir'),

  // File change listener
  onDirectivesChanged: (callback) => {
    ipcRenderer.on('agent:directivesChanged', (event, data) => callback(data));
  },

  // Save/load
  loadGame: () => ipcRenderer.invoke('save:load'),
  saveGame: (data) => ipcRenderer.invoke('save:save', data),

  // Player chat
  sendChat: (message) => ipcRenderer.invoke('chat:send', message),

  // Deep Talk — agent execution
  startDeepTalk: (agentTypeId, prompt) => ipcRenderer.invoke('deepTalk:start', agentTypeId, prompt),
  resumeDeepTalk: (agentTypeId, message) => ipcRenderer.invoke('deepTalk:resume', agentTypeId, message),
  stopDeepTalk: (agentTypeId) => ipcRenderer.invoke('deepTalk:stop', agentTypeId),
  getDeepTalkStatus: (agentTypeId) => ipcRenderer.invoke('deepTalk:status', agentTypeId),
  onDeepTalkEvent: (callback) => {
    ipcRenderer.on('deepTalk:event', (event, data) => callback(data));
  },
  onDeepTalkExit: (callback) => {
    ipcRenderer.on('deepTalk:exit', (event, data) => callback(data));
  }
});
