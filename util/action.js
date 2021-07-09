
const methods = require('./methods');
const preset = require('./preset');
/**
 * @description 命令集合, 以后可扩展为git工具
 * */
const actionMap = {
  '-v': methods.getVersion,
  'update': methods.update,
  'login': preset.set,
  'new': methods.newBranch,
  'mr': methods.mergeRequest
}


/**
 * 配置信息检测
 */
const switchAction = () => {
  if (!preset.get()) {
    log.info('未发现帐号配置,请配置后使用')
    preset.set();
    return
  }
  let args = process.argv.slice(2);
  if (args[0]) {
    if (actionMap[args[0]]) {
      actionMap[args[0]]()
    } else {
      methods.preview()
    }
  } else {
    methods.preview()
  }
}
module.exports = switchAction;