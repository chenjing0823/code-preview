const config = require('./config.js');
const inquirer = require('inquirer');

module.exports = {
  set: function (cb) {
    inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '请输入gitlab用户名'
      },
      {
        type: 'password',
        name: 'password',
        message: '请输入密码'
      },
      {
        type: 'input',
        name: 'token',
        message: '请输入gitlab access_token',
        validate: function (res) {
          return res !== ''
        }
      },
    ]).then(res => {
      config.setConfig(res)
      cb && cb()
    })
  },
  get: function () {
    return config.getConfig()
  },
  remove: function () {
    return config.remove()
  }
}
