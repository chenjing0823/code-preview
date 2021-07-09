const slog = require('single-line-log').stdout;

// 封装的 ProgressBar 工具
class myProgressBar {
  constructor (description, bar_length) {
    // 两个基本属性
    this.description = description || 'Progress';    // 命令行开头的文字信息
    this.length = bar_length || 25;           // 进度条的长度(单位：字符)，默认设为 25
  }
  // 刷新进度条图案、文字的方法
  render (opts) {
    const percent = (opts.completed / opts.total).toFixed(4);  // 计算进度(子任务的 完成数 除以 总数)
    const cell_num = Math.floor(percent * this.length);       // 计算需要多少个 █ 符号来拼凑图案
    // 拼接黑色条
    let cell = '';
    for (let i = 0; i < cell_num; i++) {
      cell += '█';
    }
    // 拼接灰色条
    let empty = '';
    for (let i = 0; i < this.length - cell_num; i++) {
      empty += '░';
    }
    // 拼接最终文本
    const cmdText = this.description + ': ' + (100 * percent).toFixed(2) + '% ' + cell + empty + ' ' + opts.completed + '/' + opts.total;
    // 在单行输出文本
    slog(cmdText);
  }
}

const bar = new myProgressBar('updating...', 50);
let progressNum = 0
let progressTimer = 0
const total = 100;
const downloading = (downNum = 0) => {
  clearTimeout(progressTimer)
  progressNum = downNum === 100 ? 100 : (progressNum >= 90 ? 90 : progressNum) // 假进度控制 防止提前100%
  if (progressNum <= total) {
    // 更新进度条
    bar.render({ completed: progressNum, total: total });

    progressNum++;
    progressTimer = setTimeout(function (){
      downloading(...arguments);
    }, 500)
  }
}

// 模块导出
module.exports = downloading;
