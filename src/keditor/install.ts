/**
 * withInstall —— Vue Plugin 安装器工厂
 *
 * 给组件挂上 install 方法，使其同时支持两种注册方式：
 * 1. app.use(KCodeEditor)                 —— 按组件自身 name（KCodeEditor）全局注册
 * 2. app.use(KCodeEditor, 'MyEditor')     —— 自定义全局注册名
 * 与 app.component('KCodeEditor', KCodeEditor) 手动注册并存不冲突。
 */
import type { App, Component, Plugin } from 'vue'

/** 组件 + install 安装器的复合类型（满足 Vue Plugin 约定，可直接传给 app.use） */
export type WithInstall<T> = T & Plugin

export function withInstall<T extends Component>(comp: T, name?: string): WithInstall<T> {
  const installer = comp as WithInstall<T>
  installer.install = (app: App, customName?: string) => {
    const regName =
      customName ?? name ?? (comp as { name?: string }).name ?? 'KCodeEditor'
    app.component(regName, comp)
  }
  return installer
}
