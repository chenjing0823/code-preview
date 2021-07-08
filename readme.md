## @xbb/code-preview

## code review 工具
> 此工具用于日常开发完成后，```code review```使用。以提高```code review```效率。

### 安装
```
npm install @xbb/code-preview -g
```

### 使用
#### 1.配置账号
```
preview login
```
按步骤 输入公司的gitlab``` 用户名```、```密码```、```access_token```
> access_token: 在gitlab的http://192.168.10.6/profile/personal_access_tokens 设置后，复制下来即可

#### 2.创建分支
1. 若要新建一个``` feature/test ```
2. 默认从``` master ```拉取
3. 自动将生成的分支 推送 至``` origin ```
```
preview new feature/test
```

> tips: 后续迭代 会加入 
> + 从指定分支拉取分支
> + 其他需求 bug等 

后面开发过程中 在``` feature/test ```分支提交代码 该怎么提交 就怎么提交。后续考虑也加入命令行```commit```、 ```push```等，集成完整功能

#### 3.提交merge request
最主要的就是这个环节：

在``` feature/test ```分支下，运行以下命令
```
preview mr
# 或者指定分支
preview mr hotfix/v4.41.0
```
> tips: 开发过程中 还是要正常
1. 输入core review对象，即负责人：如陈靖 输入 ```chenjing```, 名字来自```gitlab```账户
2. 脚本会自动 mr ``` feature/test ``` => ```hotfix/v4.41.0```，并生成```review ```的```url```。
3. 将连接发送至```review```对象，或者群里。大家都可点击。
4. ```review```无异常后，需要点击页面的```merge```按钮，完成```merge```


### change log
```1.0.2```
> + code-preview 用 preview 代替

```1.0.0```
> + 能基于新建分支
> + 正常merge request，
