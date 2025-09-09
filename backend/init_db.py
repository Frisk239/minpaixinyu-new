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

# 福州市题目模型
class FuzhouQuestion(db.Model):
    __tablename__ = 'fuzhou_questions'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)   # 题目文本
    option_a = db.Column(db.String(500), nullable=False) # 选项A
    option_b = db.Column(db.String(500), nullable=False) # 选项B
    option_c = db.Column(db.String(500), nullable=False) # 选项C
    option_d = db.Column(db.String(500), nullable=False) # 选项D
    correct_answer = db.Column(db.String(1), nullable=False) # 正确答案 (A/B/C/D)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'city_name': '福州市',
            'question_text': self.question_text,
            'options': {
                'A': self.option_a,
                'B': self.option_b,
                'C': self.option_c,
                'D': self.option_d
            },
            'correct_answer': self.correct_answer,
            'created_at': self.created_at.isoformat()
        }

# 泉州市题目模型
class QuanzhouQuestion(db.Model):
    __tablename__ = 'quanzhou_questions'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)   # 题目文本
    option_a = db.Column(db.String(500), nullable=False) # 选项A
    option_b = db.Column(db.String(500), nullable=False) # 选项B
    option_c = db.Column(db.String(500), nullable=False) # 选项C
    option_d = db.Column(db.String(500), nullable=False) # 选项D
    correct_answer = db.Column(db.String(1), nullable=False) # 正确答案 (A/B/C/D)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'city_name': '泉州市',
            'question_text': self.question_text,
            'options': {
                'A': self.option_a,
                'B': self.option_b,
                'C': self.option_c,
                'D': self.option_d
            },
            'correct_answer': self.correct_answer,
            'created_at': self.created_at.isoformat()
        }

# 南平市题目模型
class NanpingQuestion(db.Model):
    __tablename__ = 'nanping_questions'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)   # 题目文本
    option_a = db.Column(db.String(500), nullable=False) # 选项A
    option_b = db.Column(db.String(500), nullable=False) # 选项B
    option_c = db.Column(db.String(500), nullable=False) # 选项C
    option_d = db.Column(db.String(500), nullable=False) # 选项D
    correct_answer = db.Column(db.String(1), nullable=False) # 正确答案 (A/B/C/D)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'city_name': '南平市',
            'question_text': self.question_text,
            'options': {
                'A': self.option_a,
                'B': self.option_b,
                'C': self.option_c,
                'D': self.option_d
            },
            'correct_answer': self.correct_answer,
            'created_at': self.created_at.isoformat()
        }

# 龙岩市题目模型
class LongyanQuestion(db.Model):
    __tablename__ = 'longyan_questions'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)   # 题目文本
    option_a = db.Column(db.String(500), nullable=False) # 选项A
    option_b = db.Column(db.String(500), nullable=False) # 选项B
    option_c = db.Column(db.String(500), nullable=False) # 选项C
    option_d = db.Column(db.String(500), nullable=False) # 选项D
    correct_answer = db.Column(db.String(1), nullable=False) # 正确答案 (A/B/C/D)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'city_name': '龙岩市',
            'question_text': self.question_text,
            'options': {
                'A': self.option_a,
                'B': self.option_b,
                'C': self.option_c,
                'D': self.option_d
            },
            'correct_answer': self.correct_answer,
            'created_at': self.created_at.isoformat()
        }

# 莆田市题目模型
class PutianQuestion(db.Model):
    __tablename__ = 'putian_questions'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)   # 题目文本
    option_a = db.Column(db.String(500), nullable=False) # 选项A
    option_b = db.Column(db.String(500), nullable=False) # 选项B
    option_c = db.Column(db.String(500), nullable=False) # 选项C
    option_d = db.Column(db.String(500), nullable=False) # 选项D
    correct_answer = db.Column(db.String(1), nullable=False) # 正确答案 (A/B/C/D)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'city_name': '莆田市',
            'question_text': self.question_text,
            'options': {
                'A': self.option_a,
                'B': self.option_b,
                'C': self.option_c,
                'D': self.option_d
            },
            'correct_answer': self.correct_answer,
            'created_at': self.created_at.isoformat()
        }

# 用户答题记录模型
class UserQuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    city_name = db.Column(db.String(50), nullable=False)
    question_ids = db.Column(db.Text, nullable=False)  # JSON格式存储题目ID数组
    user_answers = db.Column(db.Text, nullable=False)  # JSON格式存储用户答案
    correct_answers = db.Column(db.Text, nullable=False)  # JSON格式存储正确答案
    score = db.Column(db.Integer, nullable=False)  # 答对数量
    total_questions = db.Column(db.Integer, nullable=False)  # 总题目数
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 建立关系
    user = db.relationship('User', backref=db.backref('quiz_attempts', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'city_name': self.city_name,
            'question_ids': json.loads(self.question_ids),
            'user_answers': json.loads(self.user_answers),
            'correct_answers': json.loads(self.correct_answers),
            'score': self.score,
            'total_questions': self.total_questions,
            'completed_at': self.completed_at.isoformat()
        }

# 用户答题统计模型
class UserQuizStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total_attempts = db.Column(db.Integer, default=0)  # 总答题次数
    total_correct = db.Column(db.Integer, default=0)   # 总答对数量
    total_questions = db.Column(db.Integer, default=0) # 总答题数量
    fuzhou_attempts = db.Column(db.Integer, default=0)  # 福州答题次数
    quanzhou_attempts = db.Column(db.Integer, default=0)  # 泉州答题次数
    nanping_attempts = db.Column(db.Integer, default=0)   # 南平答题次数
    longyan_attempts = db.Column(db.Integer, default=0)   # 龙岩答题次数
    putian_attempts = db.Column(db.Integer, default=0)    # 莆田答题次数
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 建立关系
    user = db.relationship('User', backref=db.backref('quiz_stats', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'total_attempts': self.total_attempts,
            'total_correct': self.total_correct,
            'total_questions': self.total_questions,
            'city_attempts': {
                '福州市': self.fuzhou_attempts,
                '泉州市': self.quanzhou_attempts,
                '南平市': self.nanping_attempts,
                '龙岩市': self.longyan_attempts,
                '莆田市': self.putian_attempts
            },
            'updated_at': self.updated_at.isoformat()
        }



def parse_question_files():
    """解析5个题目文件，返回题目数据"""
    question_files = [
        ('frontend/fuzhou-question.txt', '福州市'),
        ('frontend/quanzhou-question.txt', '泉州市'),
        ('frontend/nanping-question.txt', '南平市'),
        ('frontend/longyan-question.txt', '龙岩市'),
        ('frontend/putian-question.txt', '莆田市')
    ]

    questions = []

    for file_path, city_name in question_files:
        full_path = os.path.join(os.path.dirname(__file__), '..', file_path)

        if not os.path.exists(full_path):
            print(f"警告：找不到题目文件 {full_path}")
            continue

        print(f"正在解析 {city_name} 的题目文件...")

        with open(full_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # 按行分割内容
        lines = content.strip().split('\n')

        # 查找所有题目（只处理前20个）
        question_count = 0
        i = 0

        while i < len(lines) and question_count < 20:
            line = lines[i].strip()

            # 跳过空行
            if not line:
                i += 1
                continue

            # 查找题目行（以数字开头）
            if line and line[0].isdigit() and '.' in line:
                try:
                    # 解析题目
                    question_text = line.split('.', 1)[1].strip()

                    # 解析选项
                    options = {}
                    for j in range(4):  # A, B, C, D
                        if i + j + 1 < len(lines):
                            option_line = lines[i + j + 1].strip()
                            if option_line.startswith(('A.', 'B.', 'C.', 'D.')):
                                option_key = option_line[0]
                                option_text = option_line[2:].strip()
                                options[option_key] = option_text

                    # 解析答案
                    answer_line = ""
                    if i + 5 < len(lines):
                        answer_line = lines[i + 5].strip()
                        if answer_line.startswith('答案：'):
                            correct_answer = answer_line[3:].strip()

                            # 创建题目对象
                            question_data = {
                                'city_name': city_name,
                                'question_text': question_text,
                                'option_a': options.get('A', ''),
                                'option_b': options.get('B', ''),
                                'option_c': options.get('C', ''),
                                'option_d': options.get('D', ''),
                                'correct_answer': correct_answer
                            }
                            questions.append(question_data)
                            question_count += 1
                            print(f"    添加题目 {question_count}: {question_text[:30]}... -> {city_name}")

                    # 跳过已处理的行
                    i += 6

                except Exception as e:
                    print(f"解析题目时出错: {e}")
                    i += 1
            else:
                i += 1

        print(f"  从 {city_name} 成功解析到 {question_count} 道题目")

    return questions

def init_quiz_questions():
    """初始化题目数据"""
    print("开始初始化题目数据...")

    # 城市模型映射
    city_models = {
        '福州市': FuzhouQuestion,
        '泉州市': QuanzhouQuestion,
        '南平市': NanpingQuestion,
        '龙岩市': LongyanQuestion,
        '莆田市': PutianQuestion
    }

    # 检查是否已有题目数据
    total_existing = 0
    for model in city_models.values():
        total_existing += model.query.count()

    if total_existing > 0:
        print(f"题目数据已存在，共 {total_existing} 道题目，跳过初始化")
        return

    # 解析题目文件
    questions = parse_question_files()

    if not questions:
        print("错误：未解析到任何题目数据")
        return

    # 按城市分组插入题目
    city_stats = {}
    for question_data in questions:
        city_name = question_data['city_name']
        model = city_models.get(city_name)

        if model:
            question = model(
                question_text=question_data['question_text'],
                option_a=question_data['option_a'],
                option_b=question_data['option_b'],
                option_c=question_data['option_c'],
                option_d=question_data['option_d'],
                correct_answer=question_data['correct_answer']
            )
            db.session.add(question)
            city_stats[city_name] = city_stats.get(city_name, 0) + 1

    db.session.commit()
    print(f"成功初始化 {len(questions)} 道题目")

    # 显示统计结果
    for city, count in city_stats.items():
        print(f"  {city}: {count} 道题目")

def init_user_quiz_stats():
    """为所有用户初始化答题统计"""
    print("开始初始化用户答题统计...")

    users = User.query.all()
    for user in users:
        # 检查是否已有统计数据
        existing = UserQuizStats.query.filter_by(user_id=user.id).first()
        if not existing:
            stats = UserQuizStats(user_id=user.id)
            db.session.add(stats)
            print(f"  为用户 {user.username} 创建答题统计")

    db.session.commit()
    print("用户答题统计初始化完成")



def init_database():
    """初始化数据库，为所有用户创建城市探索数据和题目数据"""
    with app.app_context():
        # 创建所有表
        db.create_all()

        # 初始化题目数据
        init_quiz_questions()

        # 初始化用户答题统计
        init_user_quiz_stats()

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
