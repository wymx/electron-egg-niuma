// import { JSEncrypt } from 'jsencrypt/bin/jsencrypt.min';
import JSEncrypt from 'jsencrypt/bin/jsencrypt';
// import JSEncrypt from 'jsencrypt';

// 密钥对生成 http://web.chacuo.net/netrsakeypair

const publicKey = `MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAL3jEtY/Pv96Vfeh4DOYid1CPZmv6/xdVKjvqKLwsOIfXIujSpWB2diyUnNo9p4FOt7iwIFZk03BQ81Pc1BtC6ECAwEAAQ==`;
// const privateKey = '';

// 加密
export function encrypt(txt) {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey); // 设置公钥
  return encryptor.encrypt(txt); // 对数据进行加密
}

// 解密
export function decrypt(txt) {
  const encryptor = new JSEncrypt();
  encryptor.setPrivateKey(privateKey); // 设置私钥
  return encryptor.decrypt(txt); // 对数据进行解密
}
