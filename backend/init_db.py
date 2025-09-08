from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime

app = Flask(__name__)

# 配置
app.config['SECRET_KEY'] = 'your-secret-key-here'
db_path = os.path.join(os.path.dirname(__file__), 'data', 'users.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化扩展
db = SQLAlchemy(app)

# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = password  # 简化版，不使用hash

    def check_password(self, password):
        return self.password_hash == password

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

# 用户城市探索状态模型
class UserCityExploration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    city_name = db.Column(db.String(50), nullable=False)
    is_explored = db.Column(db.Boolean, default=False)
    explored_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 建立关系
    user = db.relationship('User', backref=db.backref('city_explorations', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'city_name': self.city_name,
            'is_explored': self.is_explored,
            'explored_at': self.explored_at.isoformat() if self.explored_at else None,
            'created_at': self.created_at.isoformat()
        }

def init_database():
    """初始化数据库，为所有用户创建城市探索数据"""
    with app.app_context():
        # 创建所有表
        db.create_all()

        # 获取所有用户
        users = User.query.all()

        # 特殊城市列表
        special_cities = ['福州市', '泉州市', '莆田市', '南平市', '龙岩市']

        for user in users:
            print(f"为用户 {user.username} 初始化城市数据...")

            # 检查每个用户是否已经有城市数据
            for city_name in special_cities:
                existing = UserCityExploration.query.filter_by(
                    user_id=user.id,
                    city_name=city_name
                ).first()

                if not existing:
                    # 创建城市探索记录
                    exploration = UserCityExploration(
                        user_id=user.id,
                        city_name=city_name,
                        is_explored=False
                    )
                    db.session.add(exploration)
                    print(f"  创建城市: {city_name}")

            db.session.commit()
            print(f"用户 {user.username} 的城市数据初始化完成")

        print("数据库初始化完成！")

if __name__ == '__main__':
    init_database()
