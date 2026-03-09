// 简化的 Steering Behaviors 实现
// 基于 Craig Reynolds 的转向行为理论

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    
    sub(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }
    
    mult(n) {
        return new Vector2(this.x * n, this.y * n);
    }
    
    div(n) {
        if (n !== 0) {
            return new Vector2(this.x / n, this.y / n);
        }
        return new Vector2(0, 0);
    }
    
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() {
        const m = this.mag();
        if (m > 0) {
            return this.div(m);
        }
        return new Vector2(0, 0);
    }
    
    limit(max) {
        const m = this.mag();
        if (m > max) {
            return this.normalize().mult(max);
        }
        return new Vector2(this.x, this.y);
    }
    
    static dist(v1, v2) {
        return v1.sub(v2).mag();
    }
}

// 简化的转向行为 - 直接返回位置增量
class SteeringBehaviors {
    constructor(unit) {
        this.unit = unit;
        this.maxSpeed = unit.moveSpeed;
    }
    
    // 计算分离力（避免碰撞）
    calculateSeparation(allUnits, desiredSeparation = 35) {
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        
        for (const other of allUnits) {
            if (other.id === this.unit.id) continue;
            
            const dx = this.unit.x - other.x;
            const dy = this.unit.y - other.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            
            if (d > 0 && d < desiredSeparation) {
                // 计算排斥方向
                const force = (desiredSeparation - d) / desiredSeparation;
                // 距离越近，排斥力越大
                sumX += (dx / d) * force * force * 2;
                sumY += (dy / d) * force * force * 2;
                count++;
            }
        }
        
        if (count > 0) {
            return { x: sumX, y: sumY };
        }
        
        return { x: 0, y: 0 };
    }
    
    // 简单的移动到目标 - 直接返回位置增量
    moveToTarget(targetX, targetY, allUnits) {
        // 计算到目标的方向和距离
        const dx = targetX - this.unit.x;
        const dy = targetY - this.unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果已经到达目标，只处理避让
        if (distance < 2) {
            const separation = this.calculateSeparation(allUnits);
            return {
                x: separation.x * this.maxSpeed * 0.5,
                y: separation.y * this.maxSpeed * 0.5
            };
        }
        
        // 计算分离力（避让其他单位）
        const separation = this.calculateSeparation(allUnits);
        
        // 基础移动方向（归一化后乘以速度）
        let moveX = (dx / distance) * this.maxSpeed;
        let moveY = (dy / distance) * this.maxSpeed;
        
        // 混合移动和避让（避让权重更高）
        moveX += separation.x * this.maxSpeed * 2.0;
        moveY += separation.y * this.maxSpeed * 2.0;
        
        // 限制最大移动距离，防止移动过快
        const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveDistance > this.maxSpeed * 2) {
            moveX = (moveX / moveDistance) * this.maxSpeed * 2;
            moveY = (moveY / moveDistance) * this.maxSpeed * 2;
        }
        
        return { x: moveX, y: moveY };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vector2, SteeringBehaviors };
}
