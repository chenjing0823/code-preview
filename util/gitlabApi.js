const axios = require('axios');
const gitApiUrl = 'http://192.168.10.6/api/v4';
const preset = require('./preset');
const log = require('./log');
const api = axios.create({
  baseURL: gitApiUrl,
  headers: {
    'PRIVATE-TOKEN': preset.get() && preset.get().token
  }
})
api.interceptors.response.use(function (response) {
  if (response && response.data) {
    return response.data;
  } else {
    return Promise.resolve(response);
  }
}, function (error) {
  if (error && error.response && error.response.status === 401) {
    log.error('gitlab身份校验失败')
    process.exit()
  }
  return Promise.resolve(error);
});
/**
 * 创建分支
 */
async function createBranch (project, name, ref) {
  return api.post(`/projects/${project}/repository/branches`, {
    branch: name,
    ref: ref || 'master'
  })
}


/**
 * 查找分支
 * 可能是bug 按照api传参 无法得到结果，而是查出项目下所有的分支名
 * 或者直接拼接可以查询 `/projects/146/repository/branches/master`。但是dev/test就无法查询 需要encodeURIComponent
 */
async function getBranch (proj, search) {
  return api.get(`/projects/${proj}/repository/branches`, {
    params: {
      search: search || ''
    }
  })
}
/**
 * 查找分支 
 * 直接拼接可以查询 `/projects/146/repository/branches/master`。但是dev/test就无法查询 需要encodeURIComponent
 */
async function getBranchUrlParam (proj, search) {
  return api.get(`/projects/${proj}/repository/branches/${search}`)
}

async function listProjects (search) {
  return api.get(`/projects`, {
    params: {
      search: search || ''
    }
  })
}
async function getMr (projId, sourceBranch, targetBranch, state, mrId) {
  if (!projId) {
    return false
  }
  return api.get(`/projects/${projId}/merge_requests`, {
    params: {
      iids: mrId || undefined,
      source_branch: sourceBranch,
      target_branch: targetBranch,
      state
    }
  })
}
async function createMr (projId, devBranch, testBranch, reviewer, title) {
  if (!devBranch || !projId || !testBranch) {
    return false
  }
  let mr = await getMr(projId, devBranch, testBranch, 'opened')
  if (mr && mr.length > 0) {
    log.error(`已存在merge request: ${mr[0].web_url}, 已自动提交dev分支`)
    return false
  }
  let user = await getUser(reviewer)
  return api.post(`/projects/${projId}/merge_requests`, {
    source_branch: devBranch,
    target_branch: testBranch,
    title: title || `merge ${devBranch} to ${testBranch}`,
    assignee_id: user.id
  })
}

async function getUser (gitNAME) {
  let user = await api.get(`/users`, {
    params: {
      username: gitNAME
    }
  })
  if (!user || !user.length) {
    return false
  }
  return user[0]
}
module.exports = {
  createBranch,
  getBranch,
  listProjects,
  getBranchUrlParam,
  createMr,
  getUser
}