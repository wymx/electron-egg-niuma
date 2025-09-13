(() => {
  // 存储录制的数据块和媒体录制器实例
  let chunks = [];
  let mediaRecorder = null;
  let currentStream = null;

  // 开始录制函数
  const startRecord = (stream) => {
    chunks = [];
    currentStream = stream;
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    // 监听数据可用事件，收集数据块
    mediaRecorder.addEventListener('dataavailable', (event) => {
      chunks.push(event.data);
    });

    // 监听录制停止事件
    mediaRecorder.addEventListener('stop', () => {
      // 停止所有轨道
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      
      // 创建 Blob 对象
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      // 创建一个下载链接元素
      const link = document.createElement('a');
      link.href = url;
      
      // 根据 MIME 类型设置文件扩展名
      let extension = 'webm';
      if (mediaRecorder.mimeType.includes('mp4')) {
        extension = 'mp4';
      } else if (mediaRecorder.mimeType.includes('ogg')) {
        extension = 'ogv'
      }
      
      link.download = `recorded-video-${new Date().getTime()}.${extension}`;
      link.click();
      // 释放资源
      URL.revokeObjectURL(url);
      chunks = [];
      mediaRecorder = null;
      currentStream = null;
    });
  };

  // 停止录制函数
  const stopRecord = () => {
    mediaRecorder && mediaRecorder.stop();
  };

  // 创建按钮容器
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.right = '30px';
  container.style.bottom = '30px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '10px';
  container.style.zIndex = '9999';
  container.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  container.style.padding = '15px';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  container.style.fontFamily = 'Arial, sans-serif';

  // 创建标题
  const title = document.createElement('div');
  title.innerText = '视频录制工具';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  title.style.textAlign = 'center';

  // 创建“视频录制”按钮
  const videoRecordBtn = document.createElement('button');
  videoRecordBtn.innerText = '录制视频元素';
  videoRecordBtn.style.padding = '8px 15px';
  videoRecordBtn.style.fontSize = '14px';
  videoRecordBtn.style.cursor = 'pointer';
  videoRecordBtn.style.marginBottom = '5px';
  videoRecordBtn.onclick = function() {
    const videoElement = document.querySelector('video');
    
    if (!videoElement) {
      alert('未找到视频元素');
      return;
    }

    try {
      // 尝试获取视频流
      const stream = videoElement.captureStream();
      videoRecordBtn.disabled = true;
      screenRecordBtn.disabled = true;
      stopBtn.disabled = false;
      startRecord(stream);
    } catch (error) {
      if (error.name === 'SecurityError') {
        alert('无法直接录制此视频（跨域限制）\n请尝试使用"屏幕录制"功能');
      } else {
        alert('录制失败：' + error.message);
      }
      console.error('录制错误:', error);
    }
  };

  // 创建“屏幕录制”按钮
  const screenRecordBtn = document.createElement('button');
  screenRecordBtn.innerText = '屏幕录制';
  screenRecordBtn.style.padding = '8px 15px';
  screenRecordBtn.style.fontSize = '14px';
  screenRecordBtn.style.cursor = 'pointer';
  screenRecordBtn.style.marginBottom = '5px';
  screenRecordBtn.onclick = async function() {
    try {
      // 请求屏幕共享
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      videoRecordBtn.disabled = true;
      screenRecordBtn.disabled = true;
      stopBtn.disabled = false;
      startRecord(stream);
      
      // 当用户手动停止屏幕共享时
      stream.getVideoTracks()[0].onended = function() {
        stopRecord();
        videoRecordBtn.disabled = false;
        screenRecordBtn.disabled = false;
        stopBtn.disabled = true;
      };
    } catch (error) {
      if (error.name !== 'AbortError') {
        alert('屏幕录制失败：' + error.message);
      }
      console.error('屏幕录制错误:', error);
    }
  };

  // 创建“结束”按钮
  const stopBtn = document.createElement('button');
  stopBtn.innerText = '停止录制';
  stopBtn.style.padding = '8px 15px';
  stopBtn.style.fontSize = '14px';
  stopBtn.style.cursor = 'pointer';
  stopBtn.disabled = true;
  stopBtn.onclick = function() {
    videoRecordBtn.disabled = false;
    screenRecordBtn.disabled = false;
    stopBtn.disabled = true;
    stopRecord();
  };

  // 添加元素到容器
  container.appendChild(title);
  container.appendChild(videoRecordBtn);
  container.appendChild(screenRecordBtn);
  container.appendChild(stopBtn);

  // 添加容器到页面
  document.body.appendChild(container);
  
  console.log('视频录制工具已加载。支持两种录制方式：\n1. 视频元素录制（仅限同源视频）\n2. 屏幕录制（可录制任何内容）');
})();