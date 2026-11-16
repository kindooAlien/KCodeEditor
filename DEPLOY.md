# KCodeEditor 文档站部署指南

文档站为 **hash 路由**（`/#/`），纯静态部署，无需任何 SPA 回退/重写配置。

## 产物构建

```bash
npm install
npm run build        # 产出 dist/ 目录（纯静态文件）
```

## 方式一：Cloudflare Pages（推荐）

免费、全球 CDN、国内可直接访问，且每次 push 自动重新部署。

1. 打开 https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. 授权 GitHub，选择 `kindooAlien/KCodeEditor` 仓库
3. 构建配置：
   - Framework preset：`Vue`（没有就选 None）
   - Build command：`npm run build`
   - Build output directory：`dist`
4. 点 **Save and Deploy**，等待约 1 分钟，得到 `xxx.pages.dev` 预览域名
5. 绑定正式域名：项目 → **Custom domains** → **Set up a custom domain** → 填 `kcodeeditor.kdesign-dev.com`
6. DNS：`kdesign-dev.com` 若已托管在 Cloudflare，会自动加 CNAME；否则去域名商 DNS 手动添加：
   - 类型 `CNAME`，主机记录 `kcodeeditor`，指向 `xxx.pages.dev`

## 方式二：Gitee Pages

国内访问最快，但需要实名认证且仓库需公开。

```bash
npm run build
git add dist -f          # Gitee Pages 需要把产物提交进仓库（与其他平台不同）
git commit -m "chore: docs dist"
git push
```

Gitee 仓库页 → **服务** → **Gitee Pages** → 部署目录选 `dist` → 启动。
注意：Gitee Pages 需手动/定时更新，不如 Cloudflare 自动。

## 方式三：Vercel / Netlify

与 Cloudflare Pages 同理：导入 GitHub 仓库，Build command `npm run build`，Output `dist`。
国内访问可能不稳定，不作为首选。

## 部署后检查清单

- [ ] `https://kcodeeditor.kdesign-dev.com/#/` 首页可打开，打字动画正常
- [ ] 顶栏 Logo 点击返回首页
- [ ] `/#/intro`、`/#/editor/basic`、`/#/api` 等路由直达正常（hash 路由直接定位）
- [ ] 明暗切换、移动端汉堡菜单正常
