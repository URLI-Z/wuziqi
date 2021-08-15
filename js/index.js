const {
    ref,
    reactive,
    onMounted
} = Vue;
const Star = {
    setup() {
        const pageLayout = reactive([])
        // 玩家playerOne是黑色 玩家playerTwo是白色
        let currentPlayer = ref('playerOne')
        // 是否游戏结束
        const isGameOver = ref(false)

        // 初始化棋子
        const initChesses = () => {
            pageLayout.splice(0, pageLayout.length)
            for (let i = 0; i < 13; i++) {
                for (let j = 0; j < 13; j++) {
                    pageLayout.push({
                        id: i + '' + j,
                        canSet: true, //能否放置
                        opacity: 0, //默认隐藏
                        backColor: 'black',
                        x: i, // 坐标X
                        y: j, // 坐标Y
                    })
                }
            }

        }

        // 和电脑玩
        const useComputer = () => {
            if (isGameOver.value) return
            // 计算机遍历所有的空点，在该点模拟黑棋和白棋推算胜率
            let emptyChesses = pageLayout.filter(item => {
                return item.canSet === true && item.opacity === 0
            })

            // '我'的最优点落子棋子
            let finallChess = {}
            // '我'最后落子点所在的赢法的数组长度
            let maxLength = 0

            // 对方的最优点落子棋子
            let enemyFinallChess = {}
            // 对方的最优点棋子所在的赢法的数组长度
            let enemyMaxLength = 0

            emptyChesses.forEach(item => {
                let tempChess = JSON.parse(JSON.stringify(item))
                // 模拟黑棋
                let blackChess = Object.assign(tempChess, { canSet: false, opacity: 1, backColor: 'black', })
                let blackMaxLength = checkMostSameChesses(blackChess)
                // 模拟白棋
                let whiteChess = Object.assign(tempChess, { canSet: false, opacity: 1, backColor: 'white', })
                let whiteMaxLength = checkMostSameChesses(whiteChess)

                // 如果当前玩家是黑色（当前玩家此时是个电脑）
                // if (
                //     (currentPlayer.value === 'playerOne') && (blackMaxLength >= whiteMaxLength) && (blackMaxLength > maxLength)) {
                //     finallChess = blackChess
                //     maxLength = blackMaxLength
                // } else if (
                //     (currentPlayer.value === 'playerTwo') &&
                //     (whiteMaxLength >= blackMaxLength) &&
                //     (whiteMaxLength > maxLength)) {
                //     finallChess = whiteChess
                //     maxLength = whiteMaxLength
                // }

                // 如果当前玩家是黑色（当前玩家此时是个电脑）
                if (currentPlayer.value === 'playerOne') {
                    // 我是黑棋时对方的最优落子点和落子点对应赢法的长度
                    if (whiteMaxLength > enemyMaxLength) {
                        enemyFinallChess = whiteChess
                        enemyMaxLength = whiteMaxLength
                    }
                    // 我是黑棋时我的最优落子点和落子点对应赢法的长度
                    if (blackMaxLength > maxLength) {
                        finallChess = blackChess
                        maxLength = blackMaxLength
                    }
                    finallChess = (maxLength > enemyMaxLength) ? blackChess : whiteChess
                } else {
                    // 我是白棋时对方的最优落子点和落子点对应赢法的长度
                    if (blackMaxLength > maxLength) {
                        enemyFinallChess = blackChess
                        enemyMaxLength = blackMaxLength
                    }
                    // 我是白棋时我的最优落子点和落子点对应赢法的长度
                    if (whiteMaxLength > enemyMaxLength) {
                        finallChess = whiteChess
                        maxLength = whiteMaxLength
                    }
                    finallChess = (enemyMaxLength > maxLength) ? whiteChess : blackChess
                }
            })

            let chess = pageLayout.find(item => item.x === finallChess.x && item.y === finallChess.y)
            console.log(`电脑落子点X:${chess.x},Y:${chess.y},当前电脑玩家：${currentPlayer.value}`)

            handleSetChess(chess)
        }

        // 玩家点击事件
        const handleChessClick = (item) => {
            handleSetChess(item)
            useComputer()
        }

        // 落子事件
        const handleSetChess = (item) => {
            if (!item.canSet) return

            // 设置当前棋子无法再点击
            item.canSet = false

            // 设置当前棋子为显示的状态
            item.opacity = 1

            // 设置当前棋子显示的颜色
            item.backColor = (currentPlayer.value === 'playerOne') ? 'black' : 'white'

            // 当前棋子周围相连的同色棋子最大个数
            let sameChessesLength = checkMostSameChesses(item)

            // 判断游戏结果
            if (sameChessesLength >= 5) {
                // 得出游戏结果后不允许再落子
                setAllChessDiasbeled()
                setTimeout(() => {
                    alert(`${currentPlayer.value === 'playerOne' ? '黑色' : '白色'}获胜`)
                }, 100);
            } else {
                // 当前游戏如果没有输赢结果，就切换角色，继续游戏
                currentPlayer.value = (currentPlayer.value === 'playerOne') ? 'playerTwo' : 'playerOne'
            }
        }

        // 检查哪个方向上相邻的棋子最多，返回相连的棋子个数
        const checkMostSameChesses = (item) => {
            let directionArray = getAllDirectionLength(item)
            directionArray.sort((a, b) => { return b.length - a.length })
            return directionArray[0].length
        }

        // 寻找四个方向的相邻点数组 item 起始点 返回一个二维数组
        const getAllDirectionLength = (item) => {
            // 
            let axises = [0, 1, 2, 3]
            let resultArray = []
            axises.forEach(condition => {
                let result = findAdjacentElements(item, condition)
                resultArray.push(result)
            })
            return resultArray
        }

        // 通过寻路算法寻找一个方向相邻点所组成的最大长度（包含自身） item起始点  condition寻找方向规则
        const findAdjacentElements = (item, condition) => {
            let openList = [], // 待遍历数组
                closeList = [] // 已遍历数组

            // 获得相邻的同色星星
            openList.push(item)
            do {
                let currentElement = openList.pop()

                closeList.push(currentElement)

                let surroundElements = getSurroundElements(currentElement, condition)

                surroundElements.map((val) => {
                    // 没有被遍历的
                    if (!existInList(val, closeList)) {
                        // 是否是待遍历的星星
                        let result = existInList(val, openList)
                        if (!result && (val.backColor === currentElement.backColor)) {
                            openList.push(val);
                        }
                    }
                })
                //如果开启列表空了，没有通路，结果为空
                if (openList.length === 0) {
                    break;
                }
            } while (true);

            return closeList
        }

        // 获取周围一个方向相邻的点  condition寻找方向规则坐标:  [0, 1, 2, 3] = [x,y,xyAxis,yxAxis]
        const getSurroundElements = (item, condition) => {
            let { x, y } = item
            // 寻找X轴上
            let xAxis = [
                { x: x - 1, y: y },
                { x: x + 1, y: y }
            ]
            // 寻找Y轴
            let yAxis = [
                { x: x, y: y - 1 },
                { x: x, y: y + 1 }
            ]
            // 寻找左斜（坐上到右下）
            let xyAxis = [
                { x: x - 1, y: y + 1 },
                { x: x + 1, y: y - 1 }
            ]
            // 寻找右斜（右上到左下）
            let yxAxis = [
                { x: x - 1, y: y - 1 },
                { x: x + 1, y: y + 1 }
            ]
            let axises = [xAxis, yAxis, xyAxis, yxAxis]
            let elementsArray = []
            axises[condition].forEach((val) => {
                let element = getElementByPoint(val)
                element !== undefined && elementsArray.push(element)
            })
            return elementsArray
        }

        // 通过下标来获取棋盘上已经存在的点对应的对象 point={x,y} 判断该点是否在页面上存在 找到就返回该对象，否则返回undefined
        const getElementByPoint = (point) => {
            let element = pageLayout.find((item) => {
                return item.x === point.x &&
                    item.y === point.y &&
                    item.opacity === 1 &&
                    item.canSet === false
            })
            return element
        }


        // 判断数组中是否有某个元素 ，有的话，直接返回在当前数组中对应的对象。否则返回undefined
        const existInList = (element, list) => {
            let result = list.find((item) => {
                return item.id === element.id
            })
            return result
        }

        // 设置全部的棋子为不可点击
        const setAllChessDiasbeled = () => {
            isGameOver.value = true
            pageLayout.forEach((item) => {
                item.canSet = false
            })
        }

        // 初始化游戏
        const initGame = () => {
            initChesses()
        }

        // 初始化
        onMounted(() => {
            initGame()
        })

        return {
            pageLayout,
            currentPlayer,
            handleSetChess,
            handleChessClick,
            initGame,
            useComputer
        }
    }
}

Vue.createApp(Star).mount('#app')