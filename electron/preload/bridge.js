/* 
 * 如果启用了上下文隔离，渲染进程无法使用electron的api，
 * 可通过contextBridge 导出api给渲染进程使用
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer,
})

contextBridge.exposeInMainWorld('electronAPI', {
  createRoom: (userName, roomName) => ipcRenderer.invoke('create-room', userName, roomName),
  getRoomList: () => ipcRenderer.invoke('get-room-list'),
  leaveRoom: (roomCode, userName) => ipcRenderer.invoke('leave-room', roomCode, userName),
  getWsPort: () => ipcRenderer.invoke('get-ws-port')
});
