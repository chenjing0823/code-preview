
const figlet = require('figlet');
const log = require('./log');
const git = require('./git');
const mrUtils = require('./mrUtils');
const inquirer = require('inquirer');
const gitlabApi = require('./gitlabApi');
const preset = require('./preset');
const config = require('./config');
const chalk = require('chalk');
const downloading = require('./progress-bar');
const execa = require('execa');

const os = require('os');
const sysType = os.type();
//Linux系统上'Linux'
//macOS 系统上'Darwin'
//Windows系统上'Windows_NT'
const cli = {
  Darwin: 'sudo npm',
  Windows_NT: 'npm'
}

/**
 * 获取本地版本
 * */
 const getVersion = () => {
  const version = require('../package').version
  log.success('当前版本: ' +  version)
}

const checkPkgVersion = async (isCheck = false) => {
  // 获取看版本列表
  const data = await execa(`${cli[sysType]}`, ['view', '@xbb/code-preview' , 'version']).catch(e => {
    log.error(e)
    process.exit()
  })
  let newVersion = JSON.parse(JSON.stringify(data.stdout))
  const currentVersion = require('../package').version
  if (newVersion) {
    if (newVersion === currentVersion && !isCheck) {
      log.success('您本地已是最新版本: ' + currentVersion)
      process.exit()
    } else {
      log.info('当前版本：' + currentVersion)
      log.success('最新版本：' + newVersion)
      if (isCheck) {
        log.success('请更新到最新版本体验更丰富的功能 - [运行：preview update]')
        log.info('---------------------------------------------------')
        return false
      }
    }
  }
}

/**
 * code-preview 获取最新版本
 * */
const update = async () => {
  await checkPkgVersion()
  downloading(0)
  await execa(`${cli[sysType]}`, [`install`, `-g`, `@xbb/code-preview`]).catch(e => {
    log.error(e)
    process.exit()
  })
  downloading(100)
  process.exit()
}

/**
 * 生成新分支
 * */
const newBranch = async () => {
  //  console.log('process.argv', process.argv)
  const verifyReg = /^[a-zA-Z0-9_\/]+$/
  const verifyText = '请输入分支名称 如 feature/test , 用于创建分支'
  let repo = await git.hasGitRepo();
  if (!repo) {
    log.error(`未知错误`);
    return
  }
  /**
   *  [ '/usr/local/bin/node', '/usr/local/bin/preview1', 'new', '-l' ]
   */
  // TODO 基于自定义分支
  // const cmList = [...process.argv]
  // let demandName = cmList[cmList.length - 1]
  // // 根据本地分支-创建新分支
  // let localBranch = ''
  // if (cmList.includes('-l')) {
  //   const branch = cmList[cmList.length - 2]
  //   localBranch = branch !== '-l' ? branch : await git.getNowBranch()
  //   log.info('本地分支：' + localBranch)
  // }
  // 新建分支后清除mr缓存
  mrUtils.rmMRBranch(repo.name)

  const params = process.argv

  if (params[3]) {
    git.createBranch(repo, params[3])
  } else {
    inquirer.prompt([
      {
        type: 'input',
        name: 'demandName',
        message: verifyText,
        validate: function (res) {
          return verifyReg.test(res)
        }
      }
    ]).then(async function (res) {
      // git.createBranch(repo, res.demandName, localBranch)
      git.createBranch(repo, res.demandName)
    })
  }
}

  /**
  * MR 指定GIT账号
  * */
const mrToUser = async (repo, branch, testBranch) => {
  inquirer.prompt([
    {
      type: 'input',
      message: `请输入review人的git帐号: `,
      name: 'reviewer',
      // default: function () {
      //   return config.getConfig('reviewer') || null
      // },
      validate: async function (res) {
        if (!res) {
          return false
        }
        let has = await gitlabApi.getUser(res)
        if (!has) {
          log.error(`未找到用户${res}`)
          return false
        }
        return true
      }
    }
  ]).then(async function (reviewer) {
    if (!reviewer.reviewer || preset.get().name === reviewer.reviewer) {
      log.info('提示：为保证代码的健壮性，merge request 不能提给自己哦！');
      return mrToUser(repo, branch, testBranch)
    }
    config.setConfig(reviewer.reviewer, 'reviewer');
    let res = await gitlabApi.createMr(repo.id, branch, testBranch, reviewer.reviewer);
    if (res) {
      log.success(`Merge Request提交成功: ${res.web_url}`)
      process.exit()
    } else {
      process.exit()
    }
  })
}

async function getOriginBranch () {
  return new Promise(resolve => {
    inquirer.prompt([
      {
        type: 'input',
        message: '是否合并当前分支至master分支: y/N ?',
        name: 'state',
        default: 'N'
      }
    ]).then((res) => {
      if (!res.state || res.state === 'y') {
        resolve('master')
      } else {
        inquirer.prompt([
          {
            type: 'input',
            message: '输入需要合并的目标分支：',
            name: 'state'
          }
        ]).then((result) => {
          resolve(result.state);
        })
      }
    })
  })
}

/**
 *
 * 创建 merge request
 * */
const mergeRequest = async () => {
  let repo = await git.hasGitRepo();
   if (!repo) {
    log.error(`当前目录下不存在前端项目`);
    return;
  }
  let branch = await git.getNowBranch();
  if (!branch) {
    log.error('当前不位于任何分支');
    return
  }
  let curtBranch = process.argv.pop()
  const isEmptyMr = curtBranch === 'mr'
  if (curtBranch && !isEmptyMr) {
    log.info('自定义 merge request: ' + curtBranch);
  }
  let testBranch
  const customBranch = mrUtils.getMRBranch(repo.name)
  if (isEmptyMr) {
    const originBranch = await getOriginBranch() // 若没有输入合并对象分支 需要确认 是否直接合并master分支

    if (customBranch) {
      const state = await mrUtils.confirmTargetBranch(customBranch)
      testBranch = state ? customBranch : originBranch
    } else {
      testBranch = originBranch
    }
  } else {
    testBranch = curtBranch
  }

  let remoteDev =  await gitlabApi.getBranchUrlParam(repo.id, encodeURIComponent(branch))
  let remoteTest =  await gitlabApi.getBranchUrlParam(repo.id, encodeURIComponent(testBranch))
  if (remoteDev.name !== branch) {
    console.log(chalk.red('远程仓库中不存在此当前开发分支: '), chalk.green(branch))
    return
  }
  if (remoteTest.name !== testBranch) {
    console.log(chalk.red('远程仓库中不存在该 Merge Request 分支: '), chalk.green(testBranch))
    const state = await mrUtils.newMrBranch(testBranch)
    if (state) {
      git.createBranchByMr(repo, testBranch, () => {
        // 更新本地自定义 mr 分支
        mrUtils.upMrBranch(repo.name, testBranch)
        mrToUser(repo, branch, testBranch)
      })
    }
  } else {
    mrToUser(repo, branch, testBranch)
  }
}
/**
 * preview 初始基本信息展示
 * */
const preview = () => {
  log.color('white', figlet.textSync('XBBFE'))
  log.success('******🔧 前置Review流程工具 code review 🔧******')
  log.success('当前版本：' +  require('../package').version)
  log.info('')
  log.color('cyan', '参数')
  log.color('white', '- -v 查看当前版本')
  log.color('white', '- update  更新')
  log.color('white', '- login  配置帐号信息(初次使用时必须先配置帐号')
  log.color('white', '- mr    提交Merge Request, 基于当前分支')
  log.info('')
  log.color('magenta', '******👉 有疑问请联系:陈靖 👈******')
}

module.exports = {
  getVersion,
  update,
  preview,
  newBranch,
  mergeRequest
}