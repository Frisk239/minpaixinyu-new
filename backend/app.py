from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
import openai
import dotenv

# 加载环境变量
dotenv.load_dotenv()

app = Flask(__name__)

# 配置静态文件目录指向frontend/static
static_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static')
app.static_folder = static_dir

# 配置
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')  # 使用环境变量
db_path = os.path.join(os.path.dirname(__file__), 'data', 'users.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Session 配置 - 支持公网环境和 HTTPS
app.config['SESSION_TYPE'] = 'filesystem'  # 使用文件系统存储 session
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_KEY_PREFIX'] = 'minpaixinyu_'
app.config['SESSION_COOKIE_SECURE'] = False  # 先设为 False 调试，生产环境设为 True
app.config['SESSION_COOKIE_HTTPONLY'] = True  # 防止 XSS 攻击
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # 先用 Lax 调试跨域问题

# 初始化扩展
db = SQLAlchemy(app)
Session(app)  # 初始化 Flask-Session

# CORS 配置 - 允许公网域名
cors_origins = [
    "http://localhost:3000",  # 开发环境
    "https://frp-say.com:39668",  # 生产环境
    "https://frp-say.com"  # 备用域名
]
CORS(app, supports_credentials=True, origins=cors_origins)

# 用户模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

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

# 创建数据库表
with app.app_context():
    db.create_all()

# API 路由
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': '缺少必要字段'}), 400

    # 检查用户是否已存在
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': '邮箱已存在'}), 400

    # 创建新用户
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    # 注册成功后自动登录
    session['user_id'] = user.id

    return jsonify({
        'message': '注册成功',
        'user': user.to_dict()
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': '缺少必要字段'}), 400

    user = User.query.filter_by(username=data['username']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': '用户名或密码错误'}), 401

    session['user_id'] = user.id

    return jsonify({
        'message': '登录成功',
        'user': user.to_dict()
    }), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': '登出成功'}), 200

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False}), 401

    user = User.query.get(user_id)
    if not user:
        session.pop('user_id', None)
        return jsonify({'authenticated': False}), 401

    return jsonify({
        'authenticated': True,
        'user': user.to_dict()
    }), 200

# 用户个人中心相关API
@app.route('/api/user/change-password', methods=['POST'])
def change_password():
    """修改密码"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': '未登录'}), 401

    user = User.query.get(user_id)
    if not user:
        session.pop('user_id', None)
        return jsonify({'error': '用户不存在'}), 401

    data = request.get_json()
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': '缺少必要字段'}), 400

    # 验证当前密码
    if not user.check_password(data['current_password']):
        return jsonify({'error': '当前密码错误'}), 400

    # 验证新密码长度
    if len(data['new_password']) < 6:
        return jsonify({'error': '新密码长度至少6位'}), 400

    # 更新密码
    user.set_password(data['new_password'])
    db.session.commit()

    return jsonify({'message': '密码修改成功'}), 200

@app.route('/api/user/delete-account', methods=['DELETE'])
def delete_account():
    """注销账号"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': '未登录'}), 401

    user = User.query.get(user_id)
    if not user:
        session.pop('user_id', None)
        return jsonify({'error': '用户不存在'}), 401

    # 清除session
    session.pop('user_id', None)

    # 删除用户的所有相关数据（但保留匿名统计）
    try:
        # 删除城市探索记录
        UserCityExploration.query.filter_by(user_id=user_id).delete()

        # 删除用户记录
        db.session.delete(user)
        db.session.commit()

        return jsonify({
            'message': '账号已成功注销，感谢您的使用',
            'anonymous_stats_preserved': True
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '注销账号失败，请稍后重试'}), 500

# 城市探索相关API
@app.route('/api/city-explorations', methods=['GET'])
def get_city_explorations():
    """获取当前用户的所有城市探索状态"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': '未登录'}), 401

    explorations = UserCityExploration.query.filter_by(user_id=user_id).all()
    return jsonify({
        'explorations': [exp.to_dict() for exp in explorations]
    }), 200

@app.route('/api/city-explorations/<city_name>', methods=['GET'])
def get_city_exploration(city_name):
    """获取特定城市的探索状态"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': '未登录'}), 401

    exploration = UserCityExploration.query.filter_by(
        user_id=user_id,
        city_name=city_name
    ).first()

    if not exploration:
        # 如果城市不存在，自动创建
        exploration = UserCityExploration(
            user_id=user_id,
            city_name=city_name,
            is_explored=False
        )
        db.session.add(exploration)
        db.session.commit()

    return jsonify({'exploration': exploration.to_dict()}), 200

@app.route('/api/city-explorations/<city_name>/explore', methods=['POST'])
def mark_city_explored(city_name):
    """标记城市为已探索"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': '未登录'}), 401

    exploration = UserCityExploration.query.filter_by(
        user_id=user_id,
        city_name=city_name
    ).first()

    if not exploration:
        return jsonify({'error': '城市不存在'}), 404

    if exploration.is_explored:
        return jsonify({'message': '城市已经探索过了'}), 200

    exploration.is_explored = True
    exploration.explored_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': '城市探索状态已更新',
        'exploration': exploration.to_dict()
    }), 200

# AI对话API
@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    """AI对话接口"""
    print("=== AI对话API调用开始 ===")

    user_id = session.get('user_id')
    if not user_id:
        print("❌ 用户未登录")
        return jsonify({'error': '未登录'}), 401

    print(f"✅ 用户ID: {user_id}")

    data = request.get_json()
    if not data or not data.get('message'):
        print("❌ 缺少消息内容")
        return jsonify({'error': '缺少消息内容'}), 400

    user_message = data['message']
    print(f"📝 用户消息: {user_message[:50]}...")

    try:
        # 获取DeepSeek API Key
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            print("❌ DEEPSEEK_API_KEY环境变量未设置")
            return jsonify({'error': 'AI服务配置错误'}), 500

        print(f"✅ API Key获取成功 (长度: {len(api_key)})")
        print(f"🔗 API Key前缀: {api_key[:10]}...")

        # 初始化DeepSeek客户端 (兼容0.28.0版本)
        print("🔧 初始化OpenAI客户端...")
        import openai
        openai.api_key = api_key
        openai.api_base = "https://api.deepseek.com"
        print("✅ 客户端初始化成功")

        # 发送请求到DeepSeek
        print("📡 发送请求到DeepSeek API...")
        response = openai.ChatCompletion.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": """你是「闽仔」，一个专业的闽派文化小伙伴。你对福建的传统文化有着深入的了解，包括但不限于：

- 福州的历史文化和侯官文化
- 泉州的海上丝绸之路和多元文化
- 妈祖信仰的起源和发展
- 朱子理学在福建的传承
- 龙岩的红色革命历史
- 福建的传统建筑、民俗、美食等

请用友好的、专业的语气回答用户的问题。如果你不知道确切信息，请诚实地说明。回答要准确、有趣、有教育意义。"""
                },
                {"role": "user", "content": user_message}
            ],
            max_tokens=1000,
            temperature=0.7
        )

        print("✅ API响应成功")
        ai_response = response.choices[0].message.content
        print(f"🤖 AI回复长度: {len(ai_response)} 字符")
        print(f"🤖 AI回复预览: {ai_response[:100]}...")

        return jsonify({
            'response': ai_response,
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        print("❌ AI对话出现异常")
        print(f"🔍 异常类型: {type(e).__name__}")
        print(f"📝 异常信息: {str(e)}")

        # 打印更详细的错误信息
        import traceback
        print("📋 完整错误堆栈:")
        traceback.print_exc()

        return jsonify({
            'error': 'AI服务暂时不可用，请稍后再试',
            'response': '抱歉，我现在有点小问题，请稍后再试试吧！😅'
        }), 500

# 题目相关API
@app.route('/api/questions/<city_name>', methods=['GET'])
def get_questions(city_name):
    """获取指定城市的题目"""
    try:
        # 城市名称映射
        city_mapping = {
            '福州市': 'fuzhou',
            '泉州市': 'quanzhou',
            '南平市': 'nanping',
            '龙岩市': 'longyan',
            '莆田市': 'putian',
            # 新增文化名称映射
            '福州候官文化': 'fuzhou',
            '泉州海丝文化': 'quanzhou',
            '南平朱子文化': 'nanping',
            '龙岩红色文化': 'longyan',
            '莆田妈祖文化': 'putian'
        }

        # 获取对应的文件名
        city_key = city_mapping.get(city_name, city_name)
        question_file = os.path.join(os.path.dirname(__file__), '..', 'frontend', f'{city_key}-question.txt')

        if not os.path.exists(question_file):
            return jsonify({'error': '题目文件不存在'}), 404

        # 解析题目文件
        questions = []
        with open(question_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 按题目分割
        question_blocks = content.strip().split('\n\n')

        for i, block in enumerate(question_blocks, 1):
            if not block.strip():
                continue

            lines = block.strip().split('\n')
            if len(lines) < 6:  # 题目 + 4个选项 + 答案
                continue

            # 解析题目
            question_text = lines[0].strip()
            if not question_text:
                continue

            # 解析选项
            options = {}
            for j in range(1, 5):
                if j < len(lines):
                    line = lines[j].strip()
                    if line and len(line) > 2:
                        key = line[0]  # A, B, C, D
                        value = line[2:].strip()  # 选项内容
                        options[key] = value

            # 解析答案
            correct_answer = ''
            for line in lines:
                if line.startswith('答案：'):
                    correct_answer = line.replace('答案：', '').strip()
                    break

            if options and correct_answer:
                questions.append({
                    'id': i,
                    'city_name': city_name,
                    'question_text': question_text,
                    'options': options,
                    'correct_answer': correct_answer
                })

        return jsonify({'questions': questions}), 200

    except Exception as e:
        print(f"获取题目失败: {str(e)}")
        return jsonify({'error': '获取题目失败'}), 500

@app.route('/api/questions/<city_name>/<int:question_id>/verify', methods=['POST'])
def verify_answer(city_name, question_id):
    """验证单题答案"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': '未登录'}), 401

        data = request.get_json()
        if not data or not data.get('answer'):
            return jsonify({'error': '缺少答案'}), 400

        user_answer = data['answer']

        # 获取题目文件中的正确答案
        city_mapping = {
            '福州市': 'fuzhou',
            '泉州市': 'quanzhou',
            '南平市': 'nanping',
            '龙岩市': 'longyan',
            '莆田市': 'putian',
            # 新增文化名称映射
            '福州候官文化': 'fuzhou',
            '泉州海丝文化': 'quanzhou',
            '南平朱子文化': 'nanping',
            '龙岩红色文化': 'longyan',
            '莆田妈祖文化': 'putian'
        }

        city_key = city_mapping.get(city_name, city_name)
        question_file = os.path.join(os.path.dirname(__file__), '..', 'frontend', f'{city_key}-question.txt')

        if not os.path.exists(question_file):
            return jsonify({'error': '题目文件不存在'}), 404

        # 解析题目文件获取指定题目的正确答案
        correct_answer = ''
        with open(question_file, 'r', encoding='utf-8') as f:
            content = f.read()

        question_blocks = content.strip().split('\n\n')
        if question_id <= len(question_blocks):
            block = question_blocks[question_id - 1]
            lines = block.strip().split('\n')
            for line in lines:
                if line.startswith('答案：'):
                    correct_answer = line.replace('答案：', '').strip()
                    break

        if not correct_answer:
            return jsonify({'error': '题目不存在'}), 404

        is_correct = user_answer == correct_answer

        return jsonify({
            'is_correct': is_correct,
            'correct_answer': correct_answer,
            'user_answer': user_answer
        }), 200

    except Exception as e:
        print(f"验证答案失败: {str(e)}")
        return jsonify({'error': '验证失败'}), 500

@app.route('/api/quiz/submit', methods=['POST'])
def submit_quiz():
    """提交答题结果"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': '未登录'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'error': '缺少数据'}), 400

        city_name = data.get('cityName')
        answers = data.get('answers', [])
        question_ids = data.get('questionIds', [])

        if not city_name or not answers or not question_ids:
            return jsonify({'error': '缺少必要字段'}), 400

        # 获取题目文件中的正确答案
        city_mapping = {
            '福州市': 'fuzhou',
            '泉州市': 'quanzhou',
            '南平市': 'nanping',
            '龙岩市': 'longyan',
            '莆田市': 'putian',
            # 新增文化名称映射
            '福州候官文化': 'fuzhou',
            '泉州海丝文化': 'quanzhou',
            '南平朱子文化': 'nanping',
            '龙岩红色文化': 'longyan',
            '莆田妈祖文化': 'putian'
        }

        city_key = city_mapping.get(city_name, city_name)
        question_file = os.path.join(os.path.dirname(__file__), '..', 'frontend', f'{city_key}-question.txt')

        if not os.path.exists(question_file):
            return jsonify({'error': '题目文件不存在'}), 404

        # 解析题目文件获取正确答案
        correct_answers = []
        with open(question_file, 'r', encoding='utf-8') as f:
            content = f.read()

        question_blocks = content.strip().split('\n\n')
        for block in question_blocks:
            if not block.strip():
                continue

            lines = block.strip().split('\n')
            for line in lines:
                if line.startswith('答案：'):
                    correct_answers.append(line.replace('答案：', '').strip())
                    break

        # 计算得分
        score = 0
        total = len(answers)

        for i, answer in enumerate(answers):
            if answer and i < len(correct_answers):
                if answer == correct_answers[i]:
                    score += 1

        # 如果得分达到60分，解锁城市探索权限
        if (score / total) * 100 >= 60:
            exploration = UserCityExploration.query.filter_by(
                user_id=user_id,
                city_name=city_name
            ).first()

            if not exploration:
                exploration = UserCityExploration(
                    user_id=user_id,
                    city_name=city_name,
                    is_explored=False
                )
                db.session.add(exploration)

            if not exploration.is_explored:
                exploration.is_explored = True
                exploration.explored_at = datetime.utcnow()
                db.session.commit()

        return jsonify({
            'score': score,
            'total': total,
            'percentage': round((score / total) * 100, 1),
            'passed': (score / total) * 100 >= 60
        }), 200

    except Exception as e:
        print(f"提交答题失败: {str(e)}")
        return jsonify({'error': '提交失败'}), 500

# 城市资源相关API
@app.route('/api/city/<city_name>/culture-files', methods=['GET'])
def get_culture_files(city_name):
    """获取城市的文化概览文件列表"""
    try:
        # 城市名称映射
        city_mapping = {
            '福州市': 'fuzhou',
            '泉州市': 'quanzhou',
            '南平市': 'nanping',
            '龙岩市': 'longyan',
            '莆田市': 'putian',
            # 新增文化名称映射
            '福州候官文化': 'fuzhou',
            '泉州海丝文化': 'quanzhou',
            '南平朱子文化': 'nanping',
            '龙岩红色文化': 'longyan',
            '莆田妈祖文化': 'putian'
        }

        city_key = city_mapping.get(city_name, city_name)
        culture_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static', city_key, 'culture-introduction')

        if not os.path.exists(culture_dir):
            return jsonify({'files': []}), 200

        # 获取所有txt文件
        files = []
        for file in os.listdir(culture_dir):
            if file.endswith('.txt'):
                files.append(file)

        return jsonify({'files': files}), 200

    except Exception as e:
        print(f"获取文化文件列表失败: {str(e)}")
        return jsonify({'error': '获取文件列表失败'}), 500

@app.route('/api/city/<city_name>/culture-file/<filename>', methods=['GET'])
def get_culture_file(city_name, filename):
    """获取文化概览文件内容"""
    try:
        # 城市名称映射
        city_mapping = {
            '福州市': 'fuzhou',
            '泉州市': 'quanzhou',
            '南平市': 'nanping',
            '龙岩市': 'longyan',
            '莆田市': 'putian',
            # 新增文化名称映射
            '福州候官文化': 'fuzhou',
            '泉州海丝文化': 'quanzhou',
            '南平朱子文化': 'nanping',
            '龙岩红色文化': 'longyan',
            '莆田妈祖文化': 'putian'
        }

        city_key = city_mapping.get(city_name, city_name)
        file_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static', city_key, 'culture-introduction', filename)

        if not os.path.exists(file_path):
            return jsonify({'error': '文件不存在'}), 404

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        return jsonify({'content': content}), 200

    except Exception as e:
        print(f"获取文化文件内容失败: {str(e)}")
        return jsonify({'error': '获取文件内容失败'}), 500

@app.route('/api/city/<city_name>/expert-files', methods=['GET'])
def get_expert_files(city_name):
    """获取城市的专家文件列表"""
    try:
        # 城市名称映射
        city_mapping = {
            '福州市': 'fuzhou',
            '泉州市': 'quanzhou',
            '南平市': 'nanping',
            '龙岩市': 'longyan',
            '莆田市': 'putian',
            # 新增文化名称映射
            '福州候官文化': 'fuzhou',
            '泉州海丝文化': 'quanzhou',
            '南平朱子文化': 'nanping',
            '龙岩红色文化': 'longyan',
            '莆田妈祖文化': 'putian'
        }

        city_key = city_mapping.get(city_name, city_name)
        expert_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'static', city_key, 'professor')

        if not os.path.exists(expert_dir):
            return jsonify({'files': []}), 200

        # 获取所有docx文件
        files = []
        for file in os.listdir(expert_dir):
            if file.endswith('.docx'):
                file_path = f'/static/{city_key}/professor/{file}'
                files.append({
                    'name': file,
                    'path': file_path
                })

        return jsonify({'files': files}), 200

    except Exception as e:
        print(f"获取专家文件列表失败: {str(e)}")
        return jsonify({'error': '获取专家文件列表失败'}), 500

# 静态文件路由
@app.route('/static/<path:filename>')
def static_files(filename):
    return app.send_static_file(filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
