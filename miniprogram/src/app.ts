import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('闽派新语小程序启动')
  })

  // children 是将要会渲染的页面
  return children
}



export default App
