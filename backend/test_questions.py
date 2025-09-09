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
    created_at = db.Column(db.DateTime, default=None)

def test_questions():
    """测试题目数据"""
    with app.app_context():
        # 查询所有题目
        questions = QuizQuestion.query.all()

        print(f"数据库中共有 {len(questions)} 道题目")

        # 按城市统计
        city_stats = {}
        for question in questions:
            city = question.city_name
            city_stats[city] = city_stats.get(city, 0) + 1

        print("\n各城市题目统计:")
        for city, count in city_stats.items():
            print(f"  {city}: {count} 道题目")

        # 显示前3道题目作为示例
        print("\n前3道题目示例:")
        for i, question in enumerate(questions[:3]):
            print(f"\n题目 {i+1}:")
            print(f"  城市: {question.city_name}")
            print(f"  题目: {question.question_text}")
            print(f"  A: {question.option_a}")
            print(f"  B: {question.option_b}")
            print(f"  C: {question.option_c}")
            print(f"  D: {question.option_d}")
            print(f"  正确答案: {question.correct_answer}")

if __name__ == '__main__':
    test_questions()
