"use strict";const{contextBridge:r,ipcRenderer:e}=require("electron");r.exposeInMainWorld("kbApi",{readAll:()=>e.invoke("kb:readAll"),readAllAI:()=>e.invoke("kb:readAllAI")});
