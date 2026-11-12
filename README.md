# 装修管理 H5

Vue 3 + Vant 4 移动业务模块，提供业主申请、自检与资料签署、缴费与备案、巡检整改、两次验收、退费、记录及通知；员工端提供本人巡检、验收及办理记录。PC 源码维护在 [decoration-management-ui](https://github.com/jetlinks-v2/decoration-management-ui)。

## 官方统一外壳

本仓库的 `index.ts` 按 [官方接入手册](https://github.com/jetlinks-v2/cloud.jetlinks.mobile/blob/2.20/docs/mobile-app-modules.md) 注册 `decoration-app`，模板编码为 `DecorationManagement`。在 `cloud.jetlinks.mobile` 以正式子模块 `modules/decoration-management-wx-ui` 检出，在主工程根目录执行：

```sh
pnpm install --frozen-lockfile
pnpm dev:app decoration-app --port 9414
pnpm build:app decoration-app
```

组合产物输出到本仓库 `dist/`，包括统一外壳。业务路由为 `/applications/decoration-app` 及其 `owner`、`staff` 子路由，默认按服务端识别身份；单身份直接进入，双身份选择本次办理身份。模块只使用 `@jetlinks-mobile-core` 的项目、真实应用、请求及 Vue Router 路由守卫；不导入独立登录、根实例或独立凭据。未绑定真实应用、模板不匹配或没有任何可用装修身份时不发业务请求。切换应用/项目/端别或卸载时取消请求并清空页面，不自动重放写操作。

外壳负责项目 token、租户头及应用资产 Scope。资料上传保留 FormData，私有下载走认证 Blob；401 由外壳处理，403 保留会话。组件按页面局部导入；业务样式只在挂载期间作用于自身根节点。嵌入模式不操作浏览器历史；未保存内容通过 Vant 确认后返回。

实际部署地址由主应用的 `VITE_MOBILE_APP_URLS` 配置；HTTPS、CORS 与 CI 版本固定遵循官方手册。

## 独立账号密码调试

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

访问 `/decoration-h5/?applicationScope=<真实应用ID>&side=owner`，员工端使用 `side=staff`。只填写账号和密码，按平台配置完成 RSA 与安全验证。静态配置仅包含标题和同源 `apiBase`；不预填租户或应用 ID，不接受 URL token，不读取 PC 凭据。独立会话仅存于本标签页，并与正式外壳隔离。独立产物输出 `dist-mobile/`，正式发布请选择外壳组合产物。

`tests/browser.mjs` 使用 Playwright Chrome，默认连接独立开发服务 9413 和官方组合服务 9414；可用 `H5_STANDALONE_URL`、`H5_OFFICIAL_URL` 指定测试地址。执行前分别启动两种入口。

资料模板原件及对应 PDF 保留在 `assets/material-templates/`。在线签署继续使用完整模板和申请冻结信息，附件不得交给外部 Office 服务。真实网关授权、支付/通知以及 APP 真机联调需在对应环境完成。

业务内部页面使用 `/applications/decoration-app/view` 子路由接入外壳现有返回协议；返回逐级办理，并保留未保存确认和提交中离开保护。业主/员工入口保留端标识；根页交由外壳关闭应用。嵌入时只使用宿主内存路由，不访问父页面浏览器历史。


## 身份与业务通知

`GET /decoration/mobile/identity` 返回当前应用本人 `{owner:boolean,staff:boolean}`。业主需要业主查询权限及有效房屋关系；员工需要任务查询权限及有效员工档案。目录故障显示错误并允许重试，不伪装成无身份。`side=owner|staff` 或明确子路由仅作为已有身份的入口偏好；双身份可在顶部切换，切换前处理未保存内容、取消请求并重建页面。选择身份不授予权限。

业主的“装修通知”继续使用 `POST /decoration/mobile/applications/_notifications/_query`；员工新增“任务通知”，使用 `POST /decoration/tasks/mine/notifications/_query`。首验/二验指派提醒对应员工，业主提交整改后提醒复核角色内符合应用、员工及项目权限的人员；巡检不通过、复核驳回或通过提醒申请业主。整改提交、驳回重提和复核按钮复用原任务流程。

通知响应保留原字段，并增加 `side`（owner/staff）及可选 `taskId`。独立入口使用 `applicationScope`、`side`、`decorationId`、`step` 和可选 `taskId` 定位。业主整改 `step=rectification`；员工任务 `step=task` 且必须有 `taskId`。所有详情及操作仍由后端重新授权，链接不带凭据。

APP 消息点击时，宿主按通知 `detail.applicationId` 选择真实应用，将 `side/decorationId/step/taskId` 转换为本模块 `owner` 或 `staff` 路由的 query；模块读取该路由 query，不读取宿主外层网页的 URL。公共站内信 detail 包含 `applicationId/decorationId/side/step/taskId/url`（taskId仅任务通知存在）。APP 系统推送、角标及宿主消息中心跳转由宿主接入负责；站内信和本模块列表可用不等同于手机已收到系统推送。
