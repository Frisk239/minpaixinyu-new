import { View, Text, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Index () {
  useLoad(() => {
    console.log('闽派新语小程序首页加载完成')
  })

  const handleEnter = () => {
    Taro.navigateTo({ url: '/pages/login/login' })
  }

  return (
    <View className='index'>
      <Text className='title'>🏛️ 闽派新语</Text>
      <Text className='subtitle'>福建文化学习平台</Text>
      <Text className='description'>传承福建传统文化，开启智慧学习之旅</Text>
      <Text className='status'>小程序初始化成功！</Text>
      <Button className='enter-btn' onClick={handleEnter}>
        开始学习之旅
      </Button>
    </View>
  )
}
