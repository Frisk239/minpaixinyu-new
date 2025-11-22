import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'

// 首先引入AMD polyfill，确保在所有模块之前加载
import './polyfills/amd'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('闽派数语小程序启动')
  })

  // children 是将要会渲染的页面
  return children
}



export default App
