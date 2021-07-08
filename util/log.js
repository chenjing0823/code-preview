const chalk = require('chalk');
module.exports = {
  error: function (t) {
    console.log(chalk.red(t))
  },
  info: function (t) {
    console.log(chalk.yellow(t))
  },
  success: function (t) {
    console.log(chalk.green(t))
  },
  color: function (color, t) {
    if (chalk[color]) {
      console.log(chalk[color](t))
    }
  }
}
