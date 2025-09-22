import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'

import './app.scss'

// 初始化云开发
Taro.cloud.init({
  env: 'cloud1-9ghihm5zbb082220', // 云环境ID
  traceUser: true
})

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  // children 是将要会渲染的页面
  return children
}



export default App
