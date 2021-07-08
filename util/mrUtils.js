
const git = require('./git');
const config = require('./config')
const inquirer = require('inquirer');

const mrKey = '_code_preview_branch_'

const upMrBranch = (project, branch) => {
  const localData = config.getConfig(mrKey)
  if (localData) {
    const data = JSON.parse(localData)
    data[project] = branch
    config.setConfig(JSON.stringify(data), mrKey)
  } else {
    config.setConfig(JSON.stringify({
      project: branch
    }), mrKey)
  }
}

const getMRBranch = (project) => {
  const localData = config.getConfig(mrKey) || '{}'
  return JSON.parse(localData)[project] || ''
}

const rmMRBranch = (project) => {
  const localData = config.getConfig(mrKey) || '{}'
  const data = JSON.parse(localData)
  if (data[project]) {
    delete data[project]
    config.setConfig(JSON.stringify(data), mrKey)
  }
}

const confirmTargetBranch = (testBranch) => {
  return new Promise(resolve => {
    inquirer.prompt([
      {
        type: 'input',
        message: '是否采用自定义分支：' + testBranch + ' y/n ?',
        name: 'state'
      }
    ]).then(async function (res) {
      if (!res.state || res.state === 'y') {
        resolve(true)
      }
      resolve(false)
    })
  })
}

const newMrBranch = (testBranch) => {
  return new Promise(resolve => {
    inquirer.prompt([
      {
        type: 'input',
        message: '是否需要创建远程分支：' + testBranch + ' y/n ?',
        name: 'state'
      }
    ]).then(async function (res) {
      if (!res.state || res.state === 'y') {
        let repo = await git.hasGitRepo();
        if (!repo) {
          log.error(`当前仓库存在过历史迁移，请重新拉去代码或修改仓库下.git目录中config文件的url地址，保持和仓库地址一致`);
          return
        }
        resolve(true)
      }
      resolve(false)
    })
  })
}

module.exports = {
  upMrBranch,
  getMRBranch,
  rmMRBranch,
  confirmTargetBranch,
  newMrBranch
}