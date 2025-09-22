import { View, Text, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './login.scss'

export default function Login() {
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    Taro.showToast({
      title: '开始登录...',
      icon: 'loading'
    })

    // 简化测试：直接跳转
    setTimeout(() => {
      setLoading(false)
      Taro.showToast({
        title: '登录成功',
        icon: 'success'
      })
      Taro.navigateTo({ url: '/pages/index/index' })
    }, 2000)
  }

  return (
    <View className='login'>
      <View className='login-header'>
        <Text className='title'>🏛️ 闽派新语</Text>
        <Text className='subtitle'>福建文化学习平台</Text>
      </View>

      <View className='login-content'>
        <Text className='description'>
          传承福建传统文化，开启智慧学习之旅
        </Text>

        <View className='login-actions'>
          <Button
            className='login-btn'
            loading={loading}
            onClick={handleLogin}
          >
            微信授权登录
          </Button>
        </View>
      </View>
    </View>
  )
}
