import { View, WebView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Index () {
  useLoad(() => {
    console.log('闽派新语小程序加载完成')
  })

  const handleMessage = (e) => {
    console.log('收到web-view消息:', e.detail)
  }

  const handleLoad = () => {
    console.log('web-view加载完成')
  }

  const handleError = (e) => {
    console.log('web-view加载失败:', e.detail)
  }

  return (
    <View className='index'>
      <WebView
        src='http://43.142.143.15'
        onMessage={handleMessage}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  )
}
