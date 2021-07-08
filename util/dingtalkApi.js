const axios = require('axios');

const appkey = 'dinglo2py1ajzfm14jr3';
const appsecret = 'PwirKQpTk7xLJxkQEAx2ZNP8d1yMbCsF3_p7p1LJF20KDGiPrEFswtLmyj87f_Ah';
const corpid = 'dingf8e5f52a6b857a3aa39a90f97fcb1e09';

const api = axios.create({
  baseURL: ''
})

async function getAccessToken (appkey, appsecret) {
  return api.get(`https://oapi.dingtalk.com/gettoken`, {
    params: {
      appkey,
      appsecret
    }
  })
}
