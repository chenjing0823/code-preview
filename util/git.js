const git = require('simple-git/promise')();
const log = require('./log');
const gitlabApi = require('./gitlabApi');
const preset = require('./preset');
const execa = require('execa');
/**
 * 分支检测
 * */
async function hasGitRepo () {
  const isRepo = await git.checkIsRepo() // git判断 是否仓库
  if (!isRepo) {
    log.error('当前目录不存在git仓库!')
    process.exit()
  }
  const remotes = await git.getRemotes(true)
  if (!remotes || remotes.length < 1) {
    return false
  } else {
    let ret = remotes.find(function (item) {
      return item.refs && item.refs.push
    })
    if (!ret) {
      return false
    } else {
      const splitList = ret.refs.push.split('/')
      let repoName = splitList[splitList.length - 1]
      if (repoName.endsWith('.git')) {
        repoName = repoName.split('.')[0]
      }
      if (!repoName) {
        return false
      }
      let projects = await gitlabApi.listProjects(repoName);
      let remote = []
      if (!projects || !projects.length) {
        return false
      } else {
        remote = projects.filter(item => {
          let state = false
          let pushUrl = ret.refs.push
          if (!pushUrl.endsWith('.git')) {
            pushUrl += '.git'
          }
          if (pushUrl.startsWith('git')) {
            state = pushUrl === item.ssh_url_to_repo
          } else {
            state = pushUrl === item.http_url_to_repo
          }
          return state
        })
      }
      return remote.length ? remote[0] : false
    }
  }
}

/**
 * 根据分支名创建分支
 * */
async function generateBranchName (proj, demandName) {
  if (!demandName) {
    return false
  }
  let userName = preset.get().name
  if (!userName) {
    log.error('缺少账户配置, 请执行preview auth进行配置')
    process.exit()
  }
  let branchs = {
    dev: demandName
  }
  let hasDev = await gitlabApi.getBranch(proj, branchs.dev)
  if (hasDev && hasDev.length > 0 && hasDev.find(i => { return i.name === branchs.dev })) {
    log.error(`远程已存在dev分支${branchs.dev}`)
    process.exit()
  }
  log.info(`生成dev分支: ${branchs.dev}`)
  return branchs
}

/**
 * 切换分支
 * */
async function checkOriginBranch (branch) {
  await execa('git', ['fetch'])
  try {
    let checkout = await execa(`git`, [`checkout`, `-b`, `${branch}`, `origin/${branch}`])
    return true
  } catch (error) {
    console.log(error.message)
    process.exit()
  }
}
/**
 * 创建分支
 * */
async function  createBranch (repo, demandName, localBranch = '') {
  let branchs = await generateBranchName(repo.id, demandName)
  let createDev = await gitlabApi.createBranch(repo.id, branchs.dev, localBranch)
  if (!createDev || !createDev.name || createDev.name === 'Error') {
    log.error(`创建远程dev分支${branchs.dev}失败`)
    if (createDev.name === 'Error' && createDev.message) {
      log.error(`原因： ${createDev.message}`)
    }
    process.exit()
  }
  let checkRet = await checkOriginBranch(branchs.dev)
  if (checkRet) {
    log.success(`创建远程分支成功,本地已自动切换至开发分支${branchs.dev}`)
  }
  process.exit()
}
/**
 * 获取当前分支 - 本地.git
 * */
async function getNowBranch () {
  let ret = await git.branch();
  if (!ret) {
    return false;
  }
  return ret.current
}
/**
 * 创建分支
 * */
async function  createBranchByMr (repo, branchName, callback = () => {}) {
  let createTest = await gitlabApi.createBranch(repo.id, branchName)
  if (!createTest || !createTest.name || createTest.name === 'Error') {
    log.error(`创建远程dev分支${branchName}失败`)
    if (createTest.name === 'Error' && createTest.message) {
      log.error(`原因： ${createTest.message}`)
    }
    process.exit()
  }
  log.success(`创建远程分支成功: ${branchName}`)
  callback()
}

module.exports = {
  hasGitRepo,
  getNowBranch,
  createBranch,
  createBranchByMr
}
