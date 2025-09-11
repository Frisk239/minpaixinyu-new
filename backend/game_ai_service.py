"""
游戏AI服务 - 后端AI算法实现
使用α-β剪枝算法提供智能决策
"""

import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class CultureType(str, Enum):
    FUZHOU = "fuzhou"
    QUANZHOU = "quanzhou"
    NANPING = "nanping"
    LONGYAN = "longyan"
    PUTIAN = "putian"

class CardType(str, Enum):
    CHARACTER = "character"
    LOCATION = "location"
    QUOTE = "quote"

@dataclass
class Card:
    id: str
    name: str
    culture: CultureType
    type: CardType
    image: str

@dataclass
class GameState:
    game_phase: str
    current_player: str
    current_card: Optional[Card]
    deck: List[Card]
    player_hand: List[Card]
    ai_hand: List[Card]
    player_called_minpai: bool
    ai_called_minpai: bool
    penalties: Dict[str, int]
    round_count: int
    game_start_time: float
    winner: Optional[str]
    game_end_time: Optional[float]

class AlphaBetaPruning:
    """α-β剪枝算法实现"""

    def __init__(self, max_depth: int = 4, time_limit: float = 1.0):
        self.max_depth = max_depth
        self.time_limit = time_limit
        self.start_time = time.time()

    def search(self, game_state: GameState, depth: int, alpha: float, beta: float, maximizing_player: bool) -> Dict[str, Any]:
        """主搜索函数"""
        self.start_time = time.time()
        return self._alpha_beta_search(game_state, depth, alpha, beta, maximizing_player, 0)

    def _alpha_beta_search(self, game_state: GameState, depth: int, alpha: float, beta: float,
                          maximizing_player: bool, nodes_evaluated: int) -> Dict[str, Any]:
        """α-β剪枝搜索实现"""

        # 时间限制检查
        if time.time() - self.start_time > self.time_limit:
            return {
                "score": self._evaluate_position(game_state),
                "nodes_evaluated": nodes_evaluated + 1
            }

        # 深度限制或终止条件
        if depth == 0 or self._is_terminal(game_state):
            return {
                "score": self._evaluate_position(game_state),
                "nodes_evaluated": nodes_evaluated + 1
            }

        # 获取可能的移动
        possible_moves = self._get_possible_moves(game_state)

        # 如果没有可移动作，返回当前位置评估
        if not possible_moves:
            return {
                "score": self._evaluate_position(game_state),
                "nodes_evaluated": nodes_evaluated + 1
            }

        if maximizing_player:
            # 最大化玩家 (AI)
            max_eval = float('-inf')
            best_move = None

            for move in possible_moves:
                new_state = self._make_move(game_state, move, 'ai')
                result = self._alpha_beta_search(
                    new_state, depth - 1, alpha, beta, False, nodes_evaluated + 1
                )

                if result["score"] > max_eval:
                    max_eval = result["score"]
                    best_move = move

                alpha = max(alpha, result["score"])
                nodes_evaluated = result["nodes_evaluated"]

                # β剪枝
                if beta <= alpha:
                    break  # 剪枝

            return {
                "score": max_eval,
                "best_move": best_move,
                "nodes_evaluated": nodes_evaluated
            }
        else:
            # 最小化玩家 (人类)
            min_eval = float('inf')

            for move in possible_moves:
                new_state = self._make_move(game_state, move, 'human')
                result = self._alpha_beta_search(
                    new_state, depth - 1, alpha, beta, True, nodes_evaluated + 1
                )

                min_eval = min(min_eval, result["score"])
                beta = min(beta, result["score"])
                nodes_evaluated = result["nodes_evaluated"]

                # α剪枝
                if beta <= alpha:
                    break  # 剪枝

            return {
                "score": min_eval,
                "nodes_evaluated": nodes_evaluated
            }

    def _evaluate_position(self, game_state: GameState) -> float:
        """启发式评估函数"""
        score = 0.0

        # 1. 手牌数量差异 (核心因素)
        hand_diff = len(game_state.ai_hand) - len(game_state.player_hand)
        score += hand_diff * 15

        # 2. 罚牌差异
        penalty_diff = game_state.penalties.get('player', 0) - game_state.penalties.get('ai', 0)
        score += penalty_diff * 10

        # 3. 卡牌质量评估
        score += self._evaluate_hand_quality(game_state.ai_hand) * 3
        score -= self._evaluate_hand_quality(game_state.player_hand) * 3

        # 4. 出牌机会评估
        ai_playable = len(self._get_playable_cards(game_state.ai_hand, game_state.current_card))
        player_playable = len(self._get_playable_cards(game_state.player_hand, game_state.current_card))
        score += (ai_playable - player_playable) * 5

        # 5. 特殊情况评估
        if len(game_state.ai_hand) == 1:
            score += 20  # AI快赢了
        if len(game_state.player_hand) == 1:
            score -= 25  # 玩家快赢了

        # 6. 文化控制评估
        score += self._evaluate_culture_control(game_state.ai_hand, game_state.player_hand) * 2

        return score

    def _evaluate_hand_quality(self, hand: List[Card]) -> float:
        """评估手牌质量"""
        if not hand:
            return 0.0

        quality = 0.0

        # 文化多样性
        cultures = set(card.culture for card in hand)
        quality += len(cultures) * 3

        # 类型平衡性
        types = {}
        for card in hand:
            types[card.type] = types.get(card.type, 0) + 1

        if types:
            type_balance = min(types.values())
            quality += type_balance * 2

        # 特殊卡牌价值
        for card in hand:
            quality += self._get_card_strategic_value(card, hand)

        return quality / len(hand)  # 标准化

    def _evaluate_culture_control(self, ai_hand: List[Card], player_hand: List[Card]) -> float:
        """评估文化控制"""
        cultures = [CultureType.FUZHOU, CultureType.QUANZHOU, CultureType.NANPING,
                   CultureType.LONGYAN, CultureType.PUTIAN]
        control_score = 0.0

        for culture in cultures:
            ai_culture_cards = len([c for c in ai_hand if c.culture == culture])
            player_culture_cards = len([c for c in player_hand if c.culture == culture])

            if ai_culture_cards > player_culture_cards:
                control_score += 2
            elif ai_culture_cards < player_culture_cards:
                control_score -= 2

        return control_score

    def _get_card_strategic_value(self, card: Card, hand: List[Card]) -> float:
        """获取卡牌战略价值"""
        value = 1.0  # 基础价值

        # 唯一文化加分
        same_culture_cards = [c for c in hand if c.culture == card.culture]
        if len(same_culture_cards) == 1:
            value += 3  # 这是这个文化的最后一张牌

        # 唯一类型加分
        same_type_cards = [c for c in hand if c.type == card.type]
        if len(same_type_cards) == 1:
            value += 2  # 这是这个类型的最后一张牌

        # 根据卡牌类型调整价值
        if card.type == CardType.CHARACTER:
            value += 1.5  # 人物牌略有优势
        elif card.type == CardType.LOCATION:
            value += 1.2  # 地点牌中等价值
        elif card.type == CardType.QUOTE:
            value += 1.0  # 语录牌基础价值

        return value

    def _get_possible_moves(self, game_state: GameState) -> List[Card]:
        """获取所有可能移动"""
        return self._get_playable_cards(game_state.ai_hand, game_state.current_card)

    def _get_playable_cards(self, hand: List[Card], current_card: Optional[Card]) -> List[Card]:
        """获取可出牌"""
        if not current_card:
            return hand

        return [card for card in hand
                if card.culture == current_card.culture or card.type == current_card.type]

    def _make_move(self, game_state: GameState, card: Card, player: str) -> GameState:
        """执行移动"""
        new_state = GameState(
            game_phase=game_state.game_phase,
            current_player=game_state.current_player,
            current_card=card,  # 更新当前牌
            deck=game_state.deck.copy(),
            player_hand=game_state.player_hand.copy(),
            ai_hand=game_state.ai_hand.copy(),
            player_called_minpai=game_state.player_called_minpai,
            ai_called_minpai=game_state.ai_called_minpai,
            penalties=game_state.penalties.copy(),
            round_count=game_state.round_count,
            game_start_time=game_state.game_start_time,
            winner=game_state.winner,
            game_end_time=game_state.game_end_time
        )

        # 从手牌中移除卡牌
        if player == 'human':
            new_state.player_hand = [c for c in new_state.player_hand if c.id != card.id]
        else:
            new_state.ai_hand = [c for c in new_state.ai_hand if c.id != card.id]

        return new_state

    def _is_terminal(self, game_state: GameState) -> bool:
        """检查是否为终止状态"""
        return (len(game_state.ai_hand) == 0 or
                len(game_state.player_hand) == 0 or
                game_state.game_phase == 'finished')

class HeuristicPruning:
    """启发式剪枝优化"""

    @staticmethod
    def quick_prune(candidates: List[Card], game_state: GameState) -> List[Card]:
        """快速预剪枝"""
        if len(candidates) <= 3:
            return candidates

        # 计算每个候选牌的优先级分数
        scored_candidates = []
        for card in candidates:
            score = HeuristicPruning._calculate_priority_score(card, game_state.current_card, game_state)
            scored_candidates.append((card, score))

        # 按分数排序
        scored_candidates.sort(key=lambda x: x[1], reverse=True)

        # 只保留前60%的候选牌
        keep_count = max(2, int(len(scored_candidates) * 0.6))
        return [card for card, _ in scored_candidates[:keep_count]]

    @staticmethod
    def _calculate_priority_score(card: Card, current_card: Optional[Card], game_state: GameState) -> float:
        """计算优先级分数"""
        score = 0.0

        if not current_card:
            return score

        # 文化匹配加分
        if card.culture == current_card.culture:
            score += 15

        # 类型匹配加分
        if card.type == current_card.type:
            score += 12

        # 唯一性加分
        ai_hand = game_state.ai_hand
        same_culture_count = len([c for c in ai_hand if c.culture == card.culture])
        same_type_count = len([c for c in ai_hand if c.type == card.type])

        if same_culture_count == 1:
            score += 8
        if same_type_count == 1:
            score += 6

        # 手牌压力加分
        if len(ai_hand) <= 3:
            score += 10

        return score

    @staticmethod
    def boundary_prune(candidates: List[Card], game_state: GameState) -> List[Card]:
        """边界情况剪枝"""
        # 如果只剩1-2张牌，保留所有
        if len(game_state.ai_hand) <= 2:
            return candidates

        # 如果候选牌很少，保留所有
        if len(candidates) <= 2:
            return candidates

        # 如果时间紧张，只保留最好的几个
        time_spent = time.time() - game_state.game_start_time
        if time_spent > 0.8 and len(candidates) > 3:
            return candidates[:3]

        return candidates

class EasyAI:
    """简单AI - 快速响应，基础策略"""

    def __init__(self):
        self.name = "简单AI"
        self.description = "快速响应，基础策略"

    def make_decision(self, game_state: GameState) -> Optional[Card]:
        """简单决策：优先级策略"""
        candidates = self._get_playable_cards(game_state)

        if not candidates:
            return None
        if len(candidates) == 1:
            return candidates[0]

        # 1. 优先选择相同文化的牌
        if game_state.current_card:
            same_culture = [c for c in candidates if c.culture == game_state.current_card.culture]
            if same_culture:
                return same_culture[0]

        # 2. 其次选择相同类型的牌
        if game_state.current_card:
            same_type = [c for c in candidates if c.type == game_state.current_card.type]
            if same_type:
                return same_type[0]

        # 3. 随机选择
        import random
        return random.choice(candidates)

    def _get_playable_cards(self, game_state: GameState) -> List[Card]:
        """获取可出牌"""
        if not game_state.current_card:
            return game_state.ai_hand

        return [card for card in game_state.ai_hand
                if card.culture == game_state.current_card.culture or
                   card.type == game_state.current_card.type]

    def should_report_minpai(self, opponent_hand_count: int) -> bool:
        """简单AI准确报告"""
        return opponent_hand_count != 1


class MediumAI:
    """中等AI - 平衡策略，α-β剪枝"""

    def __init__(self):
        self.name = "中等AI"
        self.description = "策略分析，概率计算"
        self.alpha_beta = AlphaBetaPruning(max_depth=3, time_limit=0.8)

    def make_decision(self, game_state: GameState) -> Optional[Card]:
        """中等决策：使用α-β剪枝但限制深度"""
        candidates = self._get_playable_cards(game_state)

        if not candidates:
            return None
        if len(candidates) == 1:
            return candidates[0]

        # 预剪枝优化
        candidates = HeuristicPruning.quick_prune(candidates, game_state)
        candidates = HeuristicPruning.boundary_prune(candidates, game_state)

        if len(candidates) == 1:
            return candidates[0]

        # 使用α-β剪枝搜索
        result = self.alpha_beta.search(game_state, 2, float('-inf'), float('inf'), True)
        return result.get("best_move")

    def _get_playable_cards(self, game_state: GameState) -> List[Card]:
        """获取可出牌"""
        if not game_state.current_card:
            return game_state.ai_hand

        return [card for card in game_state.ai_hand
                if card.culture == game_state.current_card.culture or
                   card.type == game_state.current_card.type]

    def should_report_minpai(self, opponent_hand_count: int) -> bool:
        """中等AI准确报告"""
        return opponent_hand_count != 1


class HardAI:
    """困难AI - 深度分析，最优策略"""

    def __init__(self):
        self.name = "困难AI"
        self.description = "深度搜索，最优解算"
        self.alpha_beta = AlphaBetaPruning(max_depth=4, time_limit=1.5)

    def make_decision(self, game_state: GameState) -> Optional[Card]:
        """困难决策：完整α-β剪枝搜索"""
        start_time = time.time()
        candidates = self._get_playable_cards(game_state)

        if not candidates:
            return None
        if len(candidates) == 1:
            return candidates[0]

        # 预剪枝优化
        candidates = HeuristicPruning.quick_prune(candidates, game_state)
        candidates = HeuristicPruning.boundary_prune(candidates, game_state)

        if len(candidates) == 1:
            return candidates[0]

        # 动态调整搜索深度
        time_spent = time.time() - start_time
        adjusted_depth = self._adjust_search_depth(game_state, time_spent)

        # 使用完整α-β剪枝搜索
        result = self.alpha_beta.search(game_state, adjusted_depth, float('-inf'), float('inf'), True)
        return result.get("best_move")

    def _adjust_search_depth(self, game_state: GameState, time_spent: float) -> int:
        """动态调整搜索深度"""
        base_depth = 4

        # 如果手牌很少，增加搜索深度
        if len(game_state.ai_hand) <= 3 or len(game_state.player_hand) <= 3:
            return min(base_depth + 1, 5)

        # 如果时间不够，减少搜索深度
        if time_spent > 0.5:
            return max(base_depth - 1, 2)

        return base_depth

    def _get_playable_cards(self, game_state: GameState) -> List[Card]:
        """获取可出牌"""
        if not game_state.current_card:
            return game_state.ai_hand

        return [card for card in game_state.ai_hand
                if card.culture == game_state.current_card.culture or
                   card.type == game_state.current_card.type]

    def should_report_minpai(self, opponent_hand_count: int) -> bool:
        """困难AI从不误报"""
        return opponent_hand_count != 1


class SmartAIController:
    """智能AI控制器 - 根据难度选择不同的AI算法"""

    def __init__(self, difficulty: str = 'medium'):
        self.difficulty = difficulty
        self.ai_engines = {
            'easy': EasyAI(),
            'medium': MediumAI(),
            'hard': HardAI()
        }
        self.current_ai = self.ai_engines.get(difficulty, self.ai_engines['medium'])

    def make_decision(self, game_state: GameState) -> Optional[Card]:
        """智能决策 - 委托给对应的AI引擎"""
        return self.current_ai.make_decision(game_state)

    def should_report_minpai(self, opponent_hand_count: int) -> bool:
        """判断是否应该举报对方叫'闽派'"""
        return self.current_ai.should_report_minpai(opponent_hand_count)

    def get_ai_info(self) -> Dict[str, str]:
        """获取当前AI信息"""
        return {
            'difficulty': self.difficulty,
            'name': self.current_ai.name,
            'description': self.current_ai.description
        }

# 全局AI控制器实例
_ai_controllers = {}

def get_ai_controller(difficulty: str) -> SmartAIController:
    """获取AI控制器实例"""
    if difficulty not in _ai_controllers:
        _ai_controllers[difficulty] = SmartAIController(difficulty)
    return _ai_controllers[difficulty]

def make_ai_decision(game_state_dict: Dict[str, Any], difficulty: str) -> Dict[str, Any]:
    """AI决策接口"""
    print("🎮 === AI决策开始 ===")
    print(f"🎯 难度级别: {difficulty}")
    print(f"🎲 当前玩家: {game_state_dict.get('current_player', 'unknown')}")
    print(f"🃏 当前牌: {game_state_dict.get('current_card', {}).get('name', '无')}")
    print(f"👤 玩家手牌数: {len(game_state_dict.get('player_hand', []))}")
    print(f"🤖 AI手牌数: {len(game_state_dict.get('ai_hand', []))}")
    print(f"🎭 回合数: {game_state_dict.get('round_count', 0)}")

    try:
        # 转换数据结构
        game_state = _dict_to_game_state(game_state_dict)
        print(f"✅ 游戏状态转换完成")

        # 获取AI控制器
        ai_controller = get_ai_controller(difficulty)
        ai_info = ai_controller.get_ai_info()
        print(f"🤖 AI信息: {ai_info['name']} - {ai_info['description']}")

        # 分析当前局面
        _analyze_game_state(game_state)

        # 做出决策
        start_time = time.time()
        print(f"⚡ 开始AI决策...")

        decision = ai_controller.make_decision(game_state)

        decision_time = time.time() - start_time
        print(f"⚡ 决策耗时: {decision_time:.3f}秒")
        print(f"🎯 决策结果: {decision.name if decision else '无可用牌'}")

        # 决策后分析
        if decision:
            print(f"🃏 选择牌: {decision.name} ({decision.culture.value}, {decision.type.value})")
            print(f"📊 牌ID: {decision.id}")

        # 获取AI信息
        ai_info = ai_controller.get_ai_info()

        print("🎮 === AI决策完成 ===\n")

        return {
            "success": True,
            "card": _card_to_dict(decision) if decision else None,
            "decision_time": decision_time,
            "difficulty": difficulty,
            "ai_info": ai_info
        }

    except Exception as e:
        print(f"❌ AI决策出现异常: {str(e)}")
        import traceback
        print("📋 异常堆栈:")
        traceback.print_exc()
        print("🎮 === AI决策失败 ===\n")

        return {
            "success": False,
            "error": str(e),
            "difficulty": difficulty
        }

def _dict_to_game_state(data: Dict[str, Any]) -> GameState:
    """将字典转换为GameState对象"""
    return GameState(
        game_phase=data.get("game_phase", "playing"),
        current_player=data.get("current_player", "human"),
        current_card=_dict_to_card(data.get("current_card")) if data.get("current_card") else None,
        deck=[_dict_to_card(card) for card in data.get("deck", [])],
        player_hand=[_dict_to_card(card) for card in data.get("player_hand", [])],
        ai_hand=[_dict_to_card(card) for card in data.get("ai_hand", [])],
        player_called_minpai=data.get("player_called_minpai", False),
        ai_called_minpai=data.get("ai_called_minpai", False),
        penalties=data.get("penalties", {"player": 0, "ai": 0}),
        round_count=data.get("round_count", 1),
        game_start_time=data.get("game_start_time", time.time()),
        winner=data.get("winner"),
        game_end_time=data.get("game_end_time")
    )

def _dict_to_card(data: Dict[str, Any]) -> Card:
    """将字典转换为Card对象"""
    return Card(
        id=data["id"],
        name=data["name"],
        culture=CultureType(data["culture"]),
        type=CardType(data["type"]),
        image=data["image"]
    )

def _card_to_dict(card: Card) -> Dict[str, Any]:
    """将Card对象转换为字典"""
    return {
        "id": card.id,
        "name": card.name,
        "culture": card.culture.value,
        "type": card.type.value,
        "image": card.image
    }

def _analyze_game_state(game_state: GameState) -> None:
    """分析当前游戏局面并输出调试信息"""
    print("📊 === 游戏局面分析 ===")

    # 分析手牌分布
    ai_cultures = {}
    ai_types = {}
    for card in game_state.ai_hand:
        ai_cultures[card.culture] = ai_cultures.get(card.culture, 0) + 1
        ai_types[card.type] = ai_types.get(card.type, 0) + 1

    player_cultures = {}
    player_types = {}
    for card in game_state.player_hand:
        player_cultures[card.culture] = player_cultures.get(card.culture, 0) + 1
        player_types[card.type] = player_types.get(card.type, 0) + 1

    print(f"🤖 AI文化分布: {ai_cultures}")
    print(f"🤖 AI类型分布: {ai_types}")
    print(f"👤 玩家文化分布: {player_cultures}")
    print(f"👤 玩家类型分布: {player_types}")

    # 分析可出牌情况
    ai_playable = len(game_state.ai_hand) if not game_state.current_card else len([
        card for card in game_state.ai_hand
        if card.culture == game_state.current_card.culture or card.type == game_state.current_card.type
    ])

    player_playable = len(game_state.player_hand) if not game_state.current_card else len([
        card for card in game_state.player_hand
        if card.culture == game_state.current_card.culture or card.type == game_state.current_card.type
    ])

    print(f"🎯 AI可出牌数: {ai_playable}/{len(game_state.ai_hand)}")
    print(f"🎯 玩家可出牌数: {player_playable}/{len(game_state.player_hand)}")

    # 分析罚牌情况
    print(f"⚠️ 罚牌情况: 玩家{game_state.penalties.get('player', 0)}张, AI{game_state.penalties.get('ai', 0)}张")

    # 分析特殊状态
    if len(game_state.ai_hand) == 1:
        print("🚨 AI只剩1张牌！")
    if len(game_state.player_hand) == 1:
        print("🚨 玩家只剩1张牌！")

    if game_state.player_called_minpai:
        print("🗣️ 玩家叫了闽派！")
    if game_state.ai_called_minpai:
        print("🗣️ AI叫了闽派！")

    print("📊 === 局面分析完成 ===\n")
