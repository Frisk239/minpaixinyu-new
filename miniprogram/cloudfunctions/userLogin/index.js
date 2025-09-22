const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { userInfo } = event
  const { OPENID } = cloud.getWXContext()

  try {
    // 检查用户是否已存在
    const userExist = await db.collection('users').where({
      _openid: OPENID
    }).get()

    if (userExist.data.length === 0) {
      // 新用户，创建记录
      await db.collection('users').add({
        data: {
          _openid: OPENID,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          createTime: new Date(),
          lastLoginTime: new Date(),
          learningProgress: {
            fuzhou: 0,
            xiamen: 0,
            quanzhou: 0,
            putian: 0,
            longyan: 0,
            nanping: 0
          }
        }
      })
    } else {
      // 老用户，更新登录时间
      await db.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          lastLoginTime: new Date()
        }
      })
    }

    return {
      success: true,
      message: '登录成功'
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}
