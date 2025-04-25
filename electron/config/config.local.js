"use strict";

/**
 * Development environment configuration, coverage config.default.js
 */
module.exports = () => {
  return {
    openDevTools: {
      mode: "right", // left, right, bottom, undocked, detach
      activate: true, // 是否将打开的开发者工具窗口置于前台
      title: "", //  A title for the DevTools window (only in undocked or detach mode).
    },
    // openDevTools:false,
    openAppMenu:false,
    jobs: {
      messageLog: false,
    },
  };
};
