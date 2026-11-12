# 装修管理 H5

Vue 3 + Vant 4 移动业务模块，提供业主申请、自检与资料签署、缴费与备案、巡检整改、两次验收、退费、记录及通知；员工端提供本人巡检、验收及办理记录。PC 源码维护在 [decoration-management-ui](https://github.com/jetlinks-v2/decoration-management-ui)。

## 官方统一外壳

本仓库的 `index.ts` 按 [官方接入手册](https://github.com/jetlinks-v2/cloud.jetlinks.mobile/blob/2.20/docs/mobile-app-modules.md) 注册 `decoration-app`，模板编码为 `DecorationManagement`。在 `cloud.jetlinks.mobile` 以正式子模块 `modules/decoration-management-wx-ui` 检出，在主工程根目录执行：

```sh
pnpm install --frozen-lockfile
pnpm dev:app decoration-app --port 9414
pnpm build:app decoration-app
```

组合产物输出到本仓库 `dist/`，包括统一外壳。业务路由为 `/applications/decoration-app` 及其 `owner`、`staff` 子路由，默认展示业主端。模块只使用 `@jetlinks-mobile-core` 的项目、真实应用、请求及同步 Back 能力；不导入独立登录、根实例或独立凭据。未绑定真实应用、模板不匹配或缺少对应端查询权限时不发业务请求。切换应用/项目/端别或卸载时取消请求并清空页面，不自动重放写操作。

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
