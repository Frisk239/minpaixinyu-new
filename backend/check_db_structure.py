from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)

# 配置
app.config['SECRET_KEY'] = 'your-secret-key-here'
db_path = os.path.join(os.path.dirname(__file__), 'data', 'users.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化扩展
db = SQLAlchemy(app)

# 导入所有模型
from init_db import *

def check_database_structure():
    """检查数据库结构"""
    with app.app_context():
        print("=== 数据库表结构 ===")

        # 获取所有表
        tables = db.metadata.tables.keys()
        for table in tables:
            print(f"📋 {table}")

        print("\n=== 题目数据统计 ===")

        # 检查各城市的题目数量
        city_models = {
            '福州市': FuzhouQuestion,
            '泉州市': QuanzhouQuestion,
            '南平市': NanpingQuestion,
            '龙岩市': LongyanQuestion,
            '莆田市': PutianQuestion
        }

        total_questions = 0
        for city_name, model in city_models.items():
            count = model.query.count()
            total_questions += count
            print(f"🏛️ {city_name}: {count} 道题目")

        print(f"\n📊 总计: {total_questions} 道题目")

        print("\n=== 用户数据统计 ===")
        user_count = User.query.count()
        print(f"👥 用户数量: {user_count}")

        quiz_attempt_count = UserQuizAttempt.query.count()
        print(f"📝 答题记录: {quiz_attempt_count}")

        quiz_stats_count = UserQuizStats.query.count()
        print(f"📈 答题统计: {quiz_stats_count}")

        city_exploration_count = UserCityExploration.query.count()
        print(f"🗺️ 城市探索记录: {city_exploration_count}")

if __name__ == '__main__':
    check_database_structure()
