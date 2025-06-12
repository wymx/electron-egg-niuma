const path = require('path');
const fs = require('fs');
const pkg = require(path.join(__dirname, "../../../package.json"));

/**
 * 清理应用缓存目录
 */
const cleanAppCache = async () => {
  const { app } = require('electron');
  const cachePath = path.join(app.getPath('cache'), pkg.name);
  
  if (fs.existsSync(cachePath)) {
    console.log('清理缓存目录:', cachePath);
    const targets = ['blob_storage', 'Code Cache', 'Cache'];
    for (const dir of targets) {
      await deleteDirectoryRecursive(path.join(cachePath, dir));
    }
  }
};

/**
 * 递归删除目录（使用Promise API）
 * @param {string} directoryPath - 目标目录路径
 */
const deleteDirectoryRecursive = async (directoryPath) => {
  try {
    await fs.promises.access(directoryPath);
    const files = await fs.promises.readdir(directoryPath);
    
    await Promise.all(files.map(async (file) => {
      const curPath = path.join(directoryPath, file);
      const stat = await fs.promises.lstat(curPath);
      
      if (stat.isDirectory()) {
        await deleteDirectoryRecursive(curPath);
      } else {
        await fs.promises.unlink(curPath);
      }
    }));
    
    await fs.promises.rmdir(directoryPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

module.exports = { cleanAppCache };