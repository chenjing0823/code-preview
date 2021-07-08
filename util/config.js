/**
 * 配置oa账号信息
 * */
 const conf = require('conf');
 const config = new conf({
   projectName: 'code-preview'
 });
 
 const keyName = 'preview';
 function setConfig (ldap, key) {
   config.set(key || keyName, ldap)
 }
 function hasConfig () {
   return !!config.get(keyName)
 }
 function getConfig (key) {
   return config.get(key || keyName)
 }
 function remove () {
   return config.delete(keyName)
 }
 module.exports = {
   setConfig,
   hasConfig,
   getConfig,
   remove
 }
 