from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime
import json

app = Flask(__name__)

# 配置
app.config['SECRET_KEY'] = 'your-secret-key-here'
db_path = os.path.join(os.path.dirname(__file__), 'data', 'users.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化扩展
db = SQLAlchemy(app)

# 题目模型
class QuizQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    city_name = db.Column(db.String(50), nullable=False)  # 地市名称
    question_text = db.Column(db.Text, nullable=False)   # 题目文本
    option_a = db.Column(db.String(500), nullable=False) # 选项A
    option_b = db.Column(db.String(500), nullable=False) # 选项B
    option_c = db.Column(db.String(500), nullable=False) # 选项C
    option_d = db.Column(db.String(500), nullable=False) # 选项D
    correct_answer = db.Column(db.String(1), nullable=False) # 正确答案 (A/B/C/D)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 用户答题统计模型
class UserQuizStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    total_attempts = db.Column(db.Integer, default=0)  # 总答题次数
    total_correct = db.Column(db.Integer, default=0)   # 总答对数量
    total_questions = db.Column(db.Integer, default=0) # 总答题数量
    fuzhou_attempts = db.Column(db.Integer, default=0)  # 福州答题次数
    quanzhou_attempts = db.Column(db.Integer, default=0)  # 泉州答题次数
    nanping_attempts = db.Column(db.Integer, default=0)   # 南平答题次数
    longyan_attempts = db.Column(db.Integer, default=0)   # 龙岩答题次数
    putian_attempts = db.Column(db.Integer, default=0)    # 莆田答题次数
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

def verify_database():
    """验证数据库初始化结果"""
    with app.app_context():
        print("=== 数据库验证结果 ===")

        # 检查题目数量
        total_questions = QuizQuestion.query.count()
        print(f"📚 总题目数量: {total_questions}")

        if total_questions > 0:
            # 按城市统计题目
            from sqlalchemy import func
            city_stats = db.session.query(
                QuizQuestion.city_name,
                func.count(QuizQuestion.id).label('count')
            ).group_by(QuizQuestion.city_name).all()

            print("🏙️ 各城市题目统计:")
            for city_name, count in city_stats:
                print(f"  {city_name}: {count} 道题目")

            # 显示前3个题目作为示例
            print("\n📝 题目示例:")
            sample_questions = QuizQuestion.query.limit(3).all()
            for i, q in enumerate(sample_questions, 1):
                print(f"{i}. [{q.city_name}] {q.question_text[:50]}...")
                print(f"   答案: {q.correct_answer}")

        # 检查用户答题统计
        total_stats = UserQuizStats.query.count()
        print(f"\n👥 用户答题统计记录数: {total_stats}")

        if total_stats > 0:
            print("📊 答题统计示例:")
            sample_stats = UserQuizStats.query.limit(2).all()
            for stats in sample_stats:
                print(f"用户ID {stats.user_id}: 总答题 {stats.total_attempts} 次，答对 {stats.total_correct} 题")

        print("\n✅ 数据库验证完成!")

if __name__ == '__main__':
    verify_database()
