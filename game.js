// 游戏核心逻辑

// 游戏状态
let gameState = {
    gold: 100,
    population: 0,
    maxPopulation: 10,
    gameOver: false,
    playerBaseHealth: 1000,
    enemyBaseHealth: 1000,
    playerUnits: [],
    enemyUnits: [],
    unitLevels: [0, 0, 0, 0, 0, 0, 0, 0], // 8个兵种的等级
    enemyGold: 100,
    enemyPopulation: 0,
    enemyMaxPopulation: 10,
    enemyUnitLevels: [0, 0, 0, 0, 0, 0, 0, 0], // 敌人兵种等级
    // 回合制相关
    roundNumber: 1,           // 当前回合数
    roundPhase: "wait",     // 回合阶段: "battle"(战斗), "wait"(等待)
    roundStartTime: 0,        // 回合开始时间
    battleDuration: 15000,    // 战斗阶段持续时间: 30秒
    waitDuration: 10000,      // 等待阶段持续时间: 10秒
    lastResourceUpdate: 0,    // 上次资源更新时间
    resourceInterval: 5000    // 资源增长间隔（5秒）
};

// 兵种配置
const unitConfigs = [
    // 1: 步兵
    {
        name: "步兵",
        cost: 10,
        population: 1,
        health: 100,
        attack: 20,
        attackSpeed: 1000,
        moveSpeed: 2,
        attackType: "普通",
        armorType: "轻甲",
        color: "#3498db"
    },
    // 2: 弓箭手
    {
        name: "弓箭手",
        cost: 20,
        population: 2,
        health: 80,
        attack: 30,
        attackSpeed: 1500,
        moveSpeed: 1.5,
        attackType: "穿刺",
        armorType: "无甲",
        color: "#2ecc71"
    },
    // 3: 法师
    {
        name: "法师",
        cost: 30,
        population: 3,
        health: 90,
        attack: 40,
        attackSpeed: 2000,
        moveSpeed: 1.2,
        attackType: "范围",
        armorType: "无甲",
        color: "#9b59b6"
    },
    // 4: 骑士
    {
        name: "骑士",
        cost: 40,
        population: 4,
        health: 150,
        attack: 35,
        attackSpeed: 1200,
        moveSpeed: 3,
        attackType: "普通",
        armorType: "重甲",
        color: "#f39c12"
    },
    // 5: 投石车
    {
        name: "投石车",
        cost: 50,
        population: 5,
        health: 120,
        attack: 60,
        attackSpeed: 3000,
        moveSpeed: 1,
        attackType: "范围",
        armorType: "重甲",
        color: "#e74c3c"
    },
    // 6: 飞行兵
    {
        name: "飞行兵",
        cost: 35,
        population: 3,
        health: 70,
        attack: 25,
        attackSpeed: 800,
        moveSpeed: 4,
        attackType: "对空",
        armorType: "轻甲",
        color: "#1abc9c"
    },
    // 7: 重装步兵
    {
        name: "重装步兵",
        cost: 25,
        population: 2,
        health: 180,
        attack: 25,
        attackSpeed: 1400,
        moveSpeed: 1.8,
        attackType: "普通",
        armorType: "重甲",
        color: "#95a5a6"
    },
    // 8: 医疗兵
    {
        name: "医疗兵",
        cost: 20,
        population: 1,
        health: 60,
        attack: 10,
        attackSpeed: 2500,
        moveSpeed: 2.5,
        attackType: "普通",
        armorType: "无甲",
        color: "#e67e22"
    }
];

// 克制系统
function getDamageMultiplier(attackType, armorType) {
    if (attackType === "穿刺" && armorType === "轻甲") return 1.5;
    if (attackType === "普通" && armorType === "重甲") return 1.5;
    if (attackType === "范围") return 1.2; // 范围伤害对人海有优势
    if (attackType === "对空" && armorType === "轻甲") return 1.5; // 飞行单位视为轻甲
    return 1;
}

// 初始化游戏
function initGame() {
    // 初始化回合开始时间
    gameState.roundStartTime = Date.now();
    
    // 创建基地
    createBase("player");
    createBase("enemy");
    
    // 绑定事件
    bindEvents();
    
    // 开始游戏循环
    gameLoop();
}

// 创建基地
function createBase(type) {
    const base = document.createElement("div");
    base.className = `base ${type}-base`;
    base.textContent = type === "player" ? "基地" : "敌方基地";
    base.setAttribute("data-type", type);
    base.setAttribute("data-health", type === "player" ? gameState.playerBaseHealth : gameState.enemyBaseHealth);
    
    const healthBar = document.createElement("div");
    healthBar.className = "health-bar";
    healthBar.style.width = "100%";
    base.appendChild(healthBar);
    
    document.getElementById("battle-field").appendChild(base);
}

// 绑定事件
function bindEvents() {
    // 出兵按钮点击事件
    document.querySelectorAll(".unit-button").forEach(button => {
        button.addEventListener("click", () => {
            const unitType = parseInt(button.dataset.unit) - 1;
            spawnUnit(unitType, "player");
        });
    });
    
    // 升级按钮点击事件
    document.querySelectorAll(".upgrade-button").forEach(button => {
        button.addEventListener("click", () => {
            const unitType = parseInt(button.dataset.unit) - 1;
            upgradeUnit(unitType);
        });
    });
    
    // 重新开始按钮点击事件
    document.getElementById("restart-button").addEventListener("click", restartGame);
}

// 出兵
function spawnUnit(unitType, type) {
    // 检查是否在等待阶段
    if (gameState.roundPhase === "wait" && type === "player") {
        console.log("出兵失败：等待阶段禁止出兵");
        return;
    }
    
    const config = unitConfigs[unitType];
    
    console.log("spawnUnit被调用 - 单位类型:", unitType, "阵营:", type);
    console.log("当前金币:", gameState.gold, "单位成本:", config.cost);
    console.log("当前人口:", gameState.population, "单位人口:", config.population, "最大人口:", gameState.maxPopulation);
    
    // 检查资源和人口
    if (type === "player" && (gameState.gold < config.cost || gameState.population + config.population > gameState.maxPopulation)) {
        console.log("出兵失败：资源或人口不足");
        return;
    }
    
    // 消耗资源
    if (type === "player") {
        gameState.gold -= config.cost;
        gameState.population += config.population;
        updateResources();
        console.log("出兵成功，剩余金币:", gameState.gold, "当前人口:", gameState.population);
    }
    
    // 直接创建单位并显示
    createUnit(unitType, type);
    console.log("单位已创建并显示");
}

// 升级兵种
function upgradeUnit(unitType) {
    const level = gameState.unitLevels[unitType];
    if (level >= 3) return; // 最高3级
    
    const upgradeCost = 50 + (unitType * 25) + (level * 25);
    if (gameState.gold < upgradeCost) return;
    
    gameState.gold -= upgradeCost;
    gameState.unitLevels[unitType]++;
    updateResources();
    updateUpgradeButtons();
}

// 更新资源显示
function updateResources() {
    document.getElementById("gold").textContent = `金币: ${gameState.gold}`;
    document.getElementById("population").textContent = `人口: ${gameState.population}/${gameState.maxPopulation}`;
    document.getElementById("round-info").textContent = `回合: ${gameState.roundNumber} - ${gameState.roundPhase}`;
}

// 更新升级按钮状态
function updateUpgradeButtons() {
    document.querySelectorAll(".upgrade-button").forEach((button, index) => {
        const level = gameState.unitLevels[index];
        if (level >= 3) {
            button.disabled = true;
            button.textContent = `步兵 Lv.${level}`;
        } else {
            const upgradeCost = 50 + (index * 25) + (level * 25);
            button.textContent = `升级${unitConfigs[index].name}\n${upgradeCost}金`;
            button.disabled = gameState.gold < upgradeCost;
        }
    });
}

// 更新出兵按钮状态
function updateUnitButtons() {
    document.querySelectorAll(".unit-button").forEach((button, index) => {
        const config = unitConfigs[index];
        button.disabled = gameState.gold < config.cost || gameState.population + config.population > gameState.maxPopulation;
    });
}

// 游戏主循环
function gameLoop() {
    if (gameState.gameOver) return;
    
    const now = Date.now();
    
    // 回合制逻辑
    const elapsed = now - gameState.roundStartTime;
    
    if (gameState.roundPhase === "battle") {
        // 战斗阶段
        
        // 检查战斗是否结束
        if (checkBattleEnd()) {
            // 战斗结束，进入等待阶段
            gameState.roundPhase = "wait";
            gameState.roundStartTime = now;
            console.log(`=== 回合 ${gameState.roundNumber} 战斗提前结束，进入等待阶段 ===`);
            updateRoundDisplay();
        } else if (elapsed >= gameState.battleDuration) {
            // 战斗时间到，进入等待阶段
            gameState.roundPhase = "wait";
            gameState.roundStartTime = now;
            console.log(`=== 回合 ${gameState.roundNumber} 战斗阶段结束，进入等待阶段 ===`);
            updateRoundDisplay();
        }
        
        // 战斗中：敌人AI持续出兵（调快速度）
        enemyAI();
        
        // 资源自动增长
        if (now - gameState.lastResourceUpdate >= gameState.resourceInterval) {
            gameState.gold += 10;
            gameState.enemyGold += 10;
            updateResources();
            updateUnitButtons();
            updateUpgradeButtons();
            gameState.lastResourceUpdate = now;
        }
        
        // 更新单位（实时战斗）- 每帧都更新
        updateUnits();
        
    } else if (gameState.roundPhase === "wait") {
        // 等待阶段
        if (elapsed >= gameState.waitDuration) {
            // 等待阶段结束，进入下一回合
            gameState.roundNumber++;
            gameState.roundPhase = "battle";
            gameState.roundStartTime = now;
            // 重置敌人出兵时间，确保新回合开始时立即出兵
            enemyLastSpawnTime = 0;
            console.log(`=== 进入第 ${gameState.roundNumber} 回合 ===`);
            updateRoundDisplay();
        }
        
        // 等待阶段：禁止出兵，只更新单位位置（让战斗继续进行）
        // enemyAI(); // 等待阶段不允许AI出兵
        updateUnits();
    }
    
    // 更新回合显示
    updateRoundTimer();
    
    // 检查游戏结束
    checkGameOver();
    
    // 继续循环
    requestAnimationFrame(gameLoop);
}

// 敌人AI - 快速出兵
let enemyLastSpawnTime = 0;
const enemySpawnCooldown = 500; // 出兵冷却时间：0.5秒

function enemyAI() {
    const now = Date.now();
    
    console.log("enemyAI被调用");
    console.log("当前金币:", gameState.enemyGold);
    console.log("当前人口:", gameState.enemyPopulation);
    console.log("冷却时间:", now - enemyLastSpawnTime, "<", enemySpawnCooldown);
    
    // 检查冷却时间
    if (now - enemyLastSpawnTime < enemySpawnCooldown) {
        console.log("冷却中，跳过");
        return;
    }
    
    // 简化AI：直接出兵，选择最便宜的单位
    const affordableUnits = unitConfigs.filter(config => {
        const canAfford = config.cost <= gameState.enemyGold;
        const hasPopulation = config.population <= gameState.enemyMaxPopulation - gameState.enemyPopulation;
        console.log("检查单位:", config.name, "成本:", config.cost, "人口:", config.population, "可负担:", canAfford, "有人口:", hasPopulation);
        return canAfford && hasPopulation;
    });
    
    console.log("可出兵数量:", affordableUnits.length);
    
    if (affordableUnits.length > 0) {
        // 优先选择低成本的单位（出兵更快）
        // 按成本排序，优先出便宜的兵
        affordableUnits.sort((a, b) => a.cost - b.cost);
        
        // 70%概率出最便宜的，30%概率随机出其他能负担的
        let selectedUnit;
        if (Math.random() < 0.7 || affordableUnits.length === 1) {
            selectedUnit = affordableUnits[0];
        } else {
            selectedUnit = affordableUnits[Math.floor(Math.random() * affordableUnits.length)];
        }
        
        const unitType = unitConfigs.findIndex(config => config.name === selectedUnit.name);
        
        if (unitType !== -1) {
            // 消耗资源
            gameState.enemyGold -= selectedUnit.cost;
            gameState.enemyPopulation += selectedUnit.population;
            
            // 直接创建单位
            createUnit(unitType, "enemy");
            enemyLastSpawnTime = now;
            console.log("敌人出兵:", selectedUnit.name, "剩余金币:", gameState.enemyGold);
        }
    } else {
        console.log("无法出兵：资源或人口不足");
    }
}

// 创建单位
function createUnit(unitType, type) {
    console.log("createUnit被调用 - 单位类型:", unitType, "阵营:", type);
    
    const config = unitConfigs[unitType];
    const level = type === "player" ? gameState.unitLevels[unitType] : gameState.enemyUnitLevels[unitType];
    
    console.log("单位配置:", config.name, "等级:", level);
    
    // 计算升级后的属性
    const health = config.health + (level * 20);
    const attack = config.attack + (level * 5);
    
    // 获取战斗区域高度
    const battleField = document.getElementById("battle-field");
    const battleFieldHeight = battleField.clientHeight;
    const unitHeight = 30; // 单位高度
    const baseHeight = 60; // 基地高度
    const margin = 10; // 边距
    
    // 计算出兵位置
    // 玩家从底部出兵：基地在底部，bottom: 10px，基地顶部在 battleFieldHeight - 70px
    // 玩家出兵位置应该在基地上方
    const playerSpawnY = battleFieldHeight - margin - baseHeight - unitHeight - 5; // 基地上方5px
    // 敌人从顶部出兵：基地在顶部，top: 10px，基地底部在 70px
    // 敌人出兵位置应该在基地下方
    const enemySpawnY = margin + baseHeight + 5; // 基地下方5px
    
    // 为单位分配一个环绕位置索引（用于攻击基地时的位置分布）
    const attackingUnits = type === "player" ? gameState.playerUnits : gameState.enemyUnits;
    const surroundIndex = attackingUnits.length;
    
    const unit = {
        id: Date.now() + Math.random(),
        type,
        unitType,
        health,
        maxHealth: health,
        attack,
        attackSpeed: config.attackSpeed,
        moveSpeed: config.moveSpeed,
        attackType: config.attackType,
        armorType: config.armorType,
        x: Math.random() * (375 - 30),
        y: type === "player" ? playerSpawnY : enemySpawnY, // 动态计算出兵位置
        target: null,
        lastAttackTime: 0,
        element: null,
        surroundIndex: surroundIndex, // 环绕位置索引
        velocity: null, // 速度向量（用于steering behaviors）
        steering: null  // SteeringBehaviors实例
    };
    
    // 初始化SteeringBehaviors
    if (typeof SteeringBehaviors !== 'undefined') {
        unit.steering = new SteeringBehaviors(unit);
    }
    
    console.log("单位数据:", unit);
    
    // 创建单位元素
    const unitElement = document.createElement("div");
    unitElement.className = "unit";
    unitElement.style.backgroundColor = config.color;
    unitElement.style.left = `${unit.x}px`;
    unitElement.style.top = `${unit.y}px`;
    unitElement.textContent = config.name.charAt(0);
    
    console.log("单位元素创建完成，位置:", unit.x, unit.y);
    
    // 阻止点击事件的默认行为
    unitElement.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    // 添加血条
    const healthBar = document.createElement("div");
    healthBar.className = "health-bar";
    healthBar.style.width = "100%";
    unitElement.appendChild(healthBar);
    
    // 添加等级显示
    if (level > 0) {
        const levelElement = document.createElement("div");
        levelElement.className = "upgrade-level";
        levelElement.textContent = level;
        unitElement.appendChild(levelElement);
    }
    
    console.log("battle-field元素:", battleField);
    
    battleField.appendChild(unitElement);
    unit.element = unitElement;
    
    console.log("单位元素已添加到DOM");
    
    // 添加到单位列表
    if (type === "player") {
        gameState.playerUnits.push(unit);
        console.log("单位已添加到玩家单位列表，当前玩家单位数:", gameState.playerUnits.length);
    } else {
        gameState.enemyUnits.push(unit);
        console.log("单位已添加到敌人单位列表，当前敌人单位数:", gameState.enemyUnits.length);
    }
}

// 更新单位
function updateUnits() {
    // 更新玩家单位
    gameState.playerUnits = gameState.playerUnits.filter(unit => {
        return updateUnit(unit);
    });
    
    // 更新敌人单位
    gameState.enemyUnits = gameState.enemyUnits.filter(unit => {
        return updateUnit(unit);
    });
}

// 检测单位碰撞并计算避让向量
function checkCollisionAndSeparate(unit) {
    const unitSize = 30; // 单位尺寸
    const minDistance = unitSize * 0.8; // 最小间距（允许轻微重叠）
    let separateX = 0;
    let separateY = 0;
    let collisionCount = 0;
    
    // 检查与所有其他单位的碰撞
    const allUnits = [...gameState.playerUnits, ...gameState.enemyUnits];
    for (const other of allUnits) {
        if (other.id === unit.id) continue; // 跳过自己
        
        const dx = unit.x - other.x;
        const dy = unit.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance && distance > 0) {
            // 计算分离向量
            const overlap = minDistance - distance;
            const ratio = overlap / distance;
            separateX += dx * ratio * 0.5;
            separateY += dy * ratio * 0.5;
            collisionCount++;
        }
    }
    
    // 如果有碰撞，返回避让向量
    if (collisionCount > 0) {
        return { x: separateX, y: separateY };
    }
    return null;
}

// 更新单个单位
function updateUnit(unit) {
    // 定期重新寻找目标
    findTarget(unit);
    
    // 获取战斗区域尺寸
    const battleField = document.getElementById("battle-field");
    const battleFieldHeight = battleField.clientHeight;
    const battleFieldWidth = battleField.clientWidth;
    const unitHeight = 30;
    const baseHeight = 60;
    const margin = 10;
    
    // 计算基地位置
    const enemyBaseBottom = margin + baseHeight;
    const playerBaseTop = battleFieldHeight - margin - baseHeight;
    
    // 获取所有单位用于群体行为
    const allUnits = [...gameState.playerUnits, ...gameState.enemyUnits];
    
    // 使用 SteeringBehaviors 或传统移动
    if (unit.steering && typeof Vector2 !== 'undefined') {
        // 计算目标位置
        let target = null;
        
        if (!unit.target) {
            // 向敌方基地移动 - 计算环绕位置
            const baseCenterX = battleFieldWidth / 2;
            const surroundRadius = 45;
            const angleStep = Math.PI / 6;
            const baseAngle = unit.type === "player" ? Math.PI / 6 : -Math.PI / 6;
            const angle = baseAngle + (unit.surroundIndex % 7) * angleStep;
            
            const targetX = baseCenterX + Math.cos(angle) * surroundRadius;
            const baseEdgeY = unit.type === "player" ? enemyBaseBottom : playerBaseTop - unitHeight;
            const targetY = baseEdgeY + (unit.type === "player" ? 1 : -1) * Math.abs(Math.sin(angle)) * surroundRadius;
            
            // 约束目标位置
            const minDistanceFromBase = 5;
            const clampedTargetY = unit.type === "player"
                ? Math.max(targetY, enemyBaseBottom + minDistanceFromBase)
                : Math.min(targetY, playerBaseTop - unitHeight - minDistanceFromBase);
            
            target = new Vector2(targetX, clampedTargetY);
            
            // 检查是否在攻击范围内
            const distToBase = Math.abs(unit.type === "player" ? unit.y - enemyBaseBottom : playerBaseTop - unitHeight - unit.y);
            if (distToBase <= 60) {
                // 攻击基地
                const now = Date.now();
                if (now - unit.lastAttackTime > unit.attackSpeed) {
                    if (unit.type === "player") {
                        gameState.enemyBaseHealth -= unit.attack;
                        updateBaseHealth("enemy");
                    } else {
                        gameState.playerBaseHealth -= unit.attack;
                        updateBaseHealth("player");
                    }
                    unit.lastAttackTime = now;
                }
            }
        } else {
            // 向敌人目标移动
            const distance = Math.sqrt(Math.pow(unit.x - unit.target.x, 2) + Math.pow(unit.y - unit.target.y, 2));
            
            if (distance > 30) {
                target = new Vector2(unit.target.x, unit.target.y);
            } else {
                // 在攻击范围内，攻击目标
                attackTarget(unit);
                target = new Vector2(unit.x, unit.y); // 保持在当前位置
            }
        }
        
        // 使用 steering behaviors 计算移动
        const move = unit.steering.moveToTarget(target.x, target.y, allUnits);
        unit.x += move.x;
        unit.y += move.y;
        
        // 约束位置，确保不进入基地
        const minDistanceFromBase = 5;
        if (unit.type === "player") {
            unit.y = Math.max(unit.y, enemyBaseBottom + minDistanceFromBase);
        } else {
            unit.y = Math.min(unit.y, playerBaseTop - unitHeight - minDistanceFromBase);
        }
    } else {
        // 降级到传统移动方式（备用）
        updateUnitTraditional(unit, battleFieldHeight, battleFieldWidth, unitHeight, enemyBaseBottom, playerBaseTop);
    }
    
    // 更新位置
    unit.element.style.left = `${unit.x}px`;
    unit.element.style.top = `${unit.y}px`;
    
    return true;
}

// 传统移动方式（备用）
function updateUnitTraditional(unit, battleFieldHeight, battleFieldWidth, unitHeight, enemyBaseBottom, playerBaseTop) {
    const baseHeight = 60;
    const margin = 10;
    
    if (!unit.target) {
        // 向敌方基地移动
        const baseCenterX = battleFieldWidth / 2;
        const surroundRadius = 45;
        const angleStep = Math.PI / 6;
        const baseAngle = unit.type === "player" ? Math.PI / 6 : -Math.PI / 6;
        const angle = baseAngle + (unit.surroundIndex % 7) * angleStep;
        
        const targetX = baseCenterX + Math.cos(angle) * surroundRadius;
        const baseEdgeY = unit.type === "player" ? enemyBaseBottom : playerBaseTop - unitHeight;
        const targetY = baseEdgeY + (unit.type === "player" ? 1 : -1) * Math.abs(Math.sin(angle)) * surroundRadius;
        
        const minDistanceFromBase = 5;
        const clampedTargetY = unit.type === "player"
            ? Math.max(targetY, enemyBaseBottom + minDistanceFromBase)
            : Math.min(targetY, playerBaseTop - unitHeight - minDistanceFromBase);
        
        const dx = targetX - unit.x;
        const dy = clampedTargetY - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 3) {
            unit.x += (dx / distance) * unit.moveSpeed;
            unit.y += (dy / distance) * unit.moveSpeed;
        }
        
        // 约束位置
        if (unit.type === "player") {
            unit.y = Math.max(unit.y, enemyBaseBottom + minDistanceFromBase);
        } else {
            unit.y = Math.min(unit.y, playerBaseTop - unitHeight - minDistanceFromBase);
        }
        
        // 攻击基地
        const distToBase = Math.abs(unit.type === "player" ? unit.y - enemyBaseBottom : playerBaseTop - unitHeight - unit.y);
        if (distToBase <= 60) {
            const now = Date.now();
            if (now - unit.lastAttackTime > unit.attackSpeed) {
                if (unit.type === "player") {
                    gameState.enemyBaseHealth -= unit.attack;
                    updateBaseHealth("enemy");
                } else {
                    gameState.playerBaseHealth -= unit.attack;
                    updateBaseHealth("player");
                }
                unit.lastAttackTime = now;
            }
        }
    } else {
        // 向敌人目标移动
        const distance = Math.sqrt(Math.pow(unit.x - unit.target.x, 2) + Math.pow(unit.y - unit.target.y, 2));
        
        if (distance > 30) {
            const dx = unit.target.x - unit.x;
            const dy = unit.target.y - unit.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                unit.x += (dx / length) * unit.moveSpeed;
                unit.y += (dy / length) * unit.moveSpeed;
            }
        } else {
            attackTarget(unit);
        }
    }
}

// 寻找目标
function findTarget(unit) {
    let targets = unit.type === "player" ? gameState.enemyUnits : gameState.playerUnits;
    
    // 寻找最近的目标
    let closestTarget = null;
    let closestDistance = Infinity;
    
    for (const target of targets) {
        // 计算欧几里得距离，考虑x轴和y轴
        const distance = Math.sqrt(Math.pow(unit.x - target.x, 2) + Math.pow(unit.y - target.y, 2));
        if (distance < closestDistance) {
            closestDistance = distance;
            closestTarget = target;
        }
    }
    
    // 如果没有找到目标，继续向敌方基地移动
    if (!closestTarget) {
        // 清除目标，让单位继续向基地移动
        unit.target = null;
    } else {
        unit.target = closestTarget;
    }
}

// 攻击目标
function attackTarget(unit) {
    if (!unit.target || unit.target.health <= 0) {
        unit.target = null;
        return;
    }
    
    const now = Date.now();
    if (now - unit.lastAttackTime > unit.attackSpeed) {
        // 计算伤害
        const damageMultiplier = getDamageMultiplier(unit.attackType, unit.target.armorType);
        const damage = unit.attack * damageMultiplier;
        
        unit.target.health -= damage;
        
        // 更新血条
        updateUnitHealth(unit.target);
        
        // 检查目标是否死亡
        if (unit.target.health <= 0) {
            // 移除死亡单位
            if (unit.target.type === "player") {
                gameState.population -= unitConfigs[unit.target.unitType].population;
                updateResources();
                // 从玩家单位列表中移除
                gameState.playerUnits = gameState.playerUnits.filter(u => u.id !== unit.target.id);
            } else {
                // 从敌人单位列表中移除
                gameState.enemyUnits = gameState.enemyUnits.filter(u => u.id !== unit.target.id);
                // 释放敌人人口
                gameState.enemyPopulation -= unitConfigs[unit.target.unitType].population;
                console.log("敌人单位死亡，释放人口:", unitConfigs[unit.target.unitType].population, "当前敌人人口:", gameState.enemyPopulation);
            }
            
            // 移除元素
            if (unit.target.element) {
                unit.target.element.remove();
            }
            
            unit.target = null;
        }
        
        unit.lastAttackTime = now;
    }
}

// 更新单位血条
function updateUnitHealth(unit) {
    if (unit.element) {
        const healthBar = unit.element.querySelector(".health-bar");
        if (healthBar) {
            const healthPercentage = (unit.health / unit.maxHealth) * 100;
            healthBar.style.width = `${healthPercentage}%`;
        }
    }
}

// 更新基地血条
function updateBaseHealth(type) {
    const base = document.querySelector(`.${type}-base`);
    if (base) {
        const healthBar = base.querySelector(".health-bar");
        if (healthBar) {
            const health = type === "player" ? gameState.playerBaseHealth : gameState.enemyBaseHealth;
            const maxHealth = 1000;
            const healthPercentage = (health / maxHealth) * 100;
            healthBar.style.width = `${healthPercentage}%`;
        }
    }
}

// 检查战斗是否结束（提前结束条件）
function checkBattleEnd() {
    // 检查是否有基地被打爆
    if (gameState.playerBaseHealth <= 0 || gameState.enemyBaseHealth <= 0) {
        return true; // 有基地被打爆，战斗结束
    }
    
    // // 检查双方兵力是否都死光
    // const hasPlayerUnits = gameState.playerUnits.length > 0;
    // const hasEnemyUnits = gameState.enemyUnits.length > 0;
    
    // // 如果双方都没有单位，战斗结束
    // if (!hasPlayerUnits && !hasEnemyUnits) {
    //     return true;
    // }
    
    return false;
}

// 检查游戏结束
function checkGameOver() {
    if (gameState.playerBaseHealth <= 0) {
        endGame("失败");
    } else if (gameState.enemyBaseHealth <= 0) {
        endGame("胜利");
    }
}

// 结束游戏
function endGame(result) {
    gameState.gameOver = true;
    document.getElementById("game-over-text").textContent = `游戏${result}！`;
    document.getElementById("game-over").style.display = "block";
}

// 更新回合显示
function updateRoundDisplay() {
    const roundInfo = document.getElementById("round-info");
    if (roundInfo) {
        const phaseText = gameState.roundPhase === "battle" ? "战斗中" : "等待中";
        roundInfo.textContent = `回合 ${gameState.roundNumber} - ${phaseText}`;
    }
}

// 更新回合计时器
function updateRoundTimer() {
    const timerDisplay = document.getElementById("round-timer");
    if (timerDisplay) {
        const now = Date.now();
        const elapsed = now - gameState.roundStartTime;
        
        let remaining;
        if (gameState.roundPhase === "battle") {
            remaining = Math.max(0, gameState.battleDuration - elapsed);
        } else {
            remaining = Math.max(0, gameState.waitDuration - elapsed);
        }
        
        const seconds = Math.ceil(remaining / 1000);
        timerDisplay.textContent = `${seconds}s`;
    }
}

// 重新开始游戏
function restartGame() {
    // 重置游戏状态
    gameState = {
        gold: 100,
        population: 0,
        maxPopulation: 10,
        gameOver: false,
        playerBaseHealth: 1000,
        enemyBaseHealth: 1000,
        playerUnits: [],
        enemyUnits: [],
        unitLevels: [0, 0, 0, 0, 0, 0, 0, 0],
        enemyGold: 100,
        enemyPopulation: 0,
        enemyMaxPopulation: 10,
        enemyUnitLevels: [0, 0, 0, 0, 0, 0, 0, 0],
        // 回合制相关
        roundNumber: 1,
        roundPhase: "wait",
        roundStartTime: Date.now(),
        battleDuration: 15000,
        waitDuration: 10000,
        lastResourceUpdate: Date.now(),
        resourceInterval: 5000
    };
    
    // 重置AI计时器
    enemyLastSpawnTime = 0;
    
    // 清空战斗区域
    const battleField = document.getElementById("battle-field");
    battleField.innerHTML = "";
    
    // 重新创建基地
    createBase("player");
    createBase("enemy");
    
    // 隐藏游戏结束界面
    document.getElementById("game-over").style.display = "none";
    
    // 更新资源显示
    updateResources();
    updateUnitButtons();
    updateUpgradeButtons();
    
    // 重新开始游戏循环
    gameLoop();
}

// 初始化游戏
window.addEventListener("load", initGame);