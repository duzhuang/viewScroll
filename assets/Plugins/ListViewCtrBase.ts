import ListViewCtrItemBase from "./ListViewCtrItemBase";

/**
 * 功能是否开启
 */
const ShowType = cc.Enum({
    /**开启 */
    TurnOn: 1,
    /**关闭 */
    TurnOff: 0,
});
/**
 * 滑动窗口凸显选中的的类
 * 
 *当选中的item开始改变时抛出 select-change-begin 事件。传递的数据是当前item的index
 *当选中的item改变完成时 select-change-end 事件。传递的数据是当前item的index
 */
const { ccclass, property } = cc._decorator; @ccclass
export default class ListViewCtrBase extends cc.Component {

    @property({
        type: cc.Integer,
        min: 3,
        tooltip: '生成的Item的个数，这个一般情况下都是奇数，如果遇到稀奇古怪的需求比如偶数，可以看看能不能商量为奇数。如果实在不行，偶数也是可以的'
    })
    itemShowCount = 3;

    @property({ type: cc.ScrollView, tooltip: '滑动的窗口' })
    scrollView: cc.ScrollView = null;

    @property({ type: cc.Integer, tooltip: '展示的item的之间的偏移量' })
    spacing = 10;

    @property({ type: cc.Prefab, tooltip: '预制体' })
    prefabItem: cc.Prefab = null;

    @property({ type: Number, slide: true, step: 0.1, max: 1, min: 0, tooltip: "当滑动的具体为item的宽度和spacing和的比例为多少时完全变化" })
    ratio = 0.5;

    @property({ type: ShowType, tooltip: '是否开启触摸滑动' })
    usingTouch = ShowType.TurnOff;


    @property({ type: ShowType, tooltip: '是否启用缩放' })
    usingScale = ShowType.TurnOff;

    @property({ type: Number, slide: true, step: 0.1, max: 1, min: 0, tooltip: '选中显示的尺寸', visible() { return this.usingScale == ShowType.TurnOn } })
    selectScaleSize = 1;

    @property({ type: Number, slide: true, step: 0.1, max: 1, min: 0, tooltip: '未选中显示的尺寸', visible() { return this.usingScale == ShowType.TurnOn } })
    unSelectScaleSize = 0.6;

    @property({ type: ShowType, tooltip: '是否启用透明' })
    usingOpacity = ShowType.TurnOff;

    @property({ type: cc.Integer, slide: true, step: 1, max: 255, min: 0, tooltip: '选中显示的透明度', visible() { return this.usingOpacity == ShowType.TurnOn } })
    selectOpacity = 255;

    @property({ type: cc.Integer, slide: true, step: 1, max: 255, min: 0, tooltip: '未中显示的透明度', visible() { return this.usingOpacity == ShowType.TurnOn } })
    unSelectOpacity = 125;


    /**子节点的数组的维护 */
    private _itemList: cc.Node[] = [];
    /**是否是点击*/
    private _isClick = false;
    /**左指针 */
    private _leftPointer: number = null;;
    /**右指针 */
    private _rightPointer: number = null;
    /**中间的位置 */
    private _centerPos: number = null;
    /**当前选中的item的index */
    private _currentIndex: number = null;
    /**当前被选中的节点 */
    private _currentSelectNode: cc.Node = null;
    /**item的数据*/
    private _itemDataList: any = null;
    /**左侧的偏移量， 当scrollView.getScrollOffset().x小于这个数的时候，item的位置就该变换了*/
    private _leftOffset: number = null;
    /**右侧的偏移量， 当scrollView.getScrollOffset().x大于这个数的时候，item的位置就该变换了*/
    private _rightOffset: number = null;
    /**实际生成的item的数量，会比设置多两个 */
    private _itemShowCount: number = null;
    /**对象池 */
    private _itemNodePool: cc.NodePool = null;
    /**是否是第一次初始化 */
    private _isInitIFrst: boolean = false;

    //====================================================声明周期函数
    protected onLoad(): void {
        this.scrollView.node.on('scrolling', this.onEventScrollRolling, this);
        this.scrollView.node.on('scroll-ended', this.onEventScrollRollingEnd, this);
    }

    protected start(): void {

    }

    //====================================================onEvent
    /**监听移动 */
    onEventScrollRolling() {
        if (this.usingTouch && !this._isClick) {
            this._onEventScrollRollingSlide();
        }
        this._refreshContentItemNodeList();
    }


    /**监听停止移动 */
    onEventScrollRollingEnd() {
        
    }

    //====================================================public Function

    /**
     * 初始化显示
     * 传入的数据必须是数组
     * @param listData 数据
     * @param defaultSelect 默认的选中
     */
    initListView(listData: any, defaultSelect?: number) {
        if (listData.length == 0 || !(listData instanceof Array)) {
            console.error("实例化ListViewCtr的数据为空或者不是数组，请检查");
            return;
        }
        this._itemShowCount = this.itemShowCount + 2;
        this._itemDataList = listData;
        //防止重复生成子节点
        if (this._isInitIFrst) return;
        this._isInitIFrst = true;
        /**设置默认的选中 */
        this._setCurrentSelect(defaultSelect);
        //设置对象池
        this._initNodePool();
        //设置content的偏移量
        this._setContentOffset();
        //设置具体的中间位置
        this._setCenterPos();
        //设置content中item的具体位置
        this._setContentItem();
        //设置item中的数据
        this._setContentItemData();
        //初始化显示
        this.onEventScrollRolling();
        //关闭scrollView的滑动
        this.scheduleOnce(_ => {
            if (this.usingTouch == ShowType.TurnOff) {
                this.scrollView.node.pauseSystemEvents(false);
                this.scrollView.node.off(cc.Node.EventType.TOUCH_MOVE);
            }
        }, 0)
    }

    /**
  * 设置被选中的状态 子类可以重写此方法来进行自定义修改
  * @param itemNode 设置item的节点
  */
    public setItemSelect(itemNode: cc.Node) {
        if (this.usingScale == ShowType.TurnOn) {
            itemNode.scale = this.selectScaleSize;
        }
        if (this.usingOpacity == ShowType.TurnOn) {
            itemNode.opacity = this.selectOpacity;
        }
    }

    /**
     * 设置未被选中状态 子类可以重写此方法来进行自定义修改
     * @param itemNode 设置item的节点
     */
    public setItemUnSelect(itemNode: cc.Node) {
        if (this.usingScale == ShowType.TurnOn) {
            itemNode.scale = this.unSelectScaleSize;
        }
        if (this.usingOpacity == ShowType.TurnOn) {
            itemNode.opacity = this.unSelectOpacity;
        }
    }

    /**
     * 滑动左边下一个item
     * @param delayTime 视图内容在规定时间内将滚动到具体位置, 如果 timeInSecond参数不传，则立即滚动到指定的位置。
     */
    public scrollToLeftNextItem(timeInSecond?: number) {
        if (this._isClick) return;
        this._isClick = true;
        let posX = -this.scrollView.getScrollOffset().x;
        this._reduceCurrentSelect();
        this.node.emit("select-change-begin", this._currentIndex);
        this.scrollView.scrollToOffset(cc.v2(posX - this.prefabItem.data.width - this.spacing, 0), timeInSecond);
        this.scheduleOnce(_ => {
            this._refreshScrollLeftPointer();
            this._scrollToLeftAddNextItem();
            this.node.emit("select-change-end", this._currentIndex);
            this._isClick = false;
        }, timeInSecond);
    }

    /**
     * 滑动右边下一个item
     * @param delayTime 视图内容在规定时间内将滚动到具体位置, 如果 timeInSecond参数不传，则立即滚动到指定的位置。
     */
    public scrollToRightNextItem(timeInSecond?: number) {
        if (this._isClick) return;
        this._isClick = true;
        let posX = -this.scrollView.getScrollOffset().x;
        this._addCurrentSelect();
        this.node.emit("select-change-begin", this._currentIndex);
        this.scrollView.scrollToOffset(cc.v2(posX + this.prefabItem.data.width + this.spacing, 0), timeInSecond);
        this.scheduleOnce(_ => {
            this._refreshScrollRightPointer();
            this._scrollToRightAddNextItem();
            this.node.emit("select-change-end", this._currentIndex);
            this._isClick = false;
        }, timeInSecond);
    }

    /**
     * 刷新item在切换的时候的动画，  子类可以重写此方法来进行扩展
     * @param itemNode 当前变化的item的节点
     * @param percent 当前占比0~1，0表示完全未选中，1代表完全选中
     */
    public refreshRollingShow(itemNode: cc.Node, percent: number) {
        if (!itemNode) return;
        //刷新scale
        if (this.usingScale == ShowType.TurnOn) {
            itemNode.scale = this.unSelectScaleSize + percent * (this.selectScaleSize - this.unSelectScaleSize);
        }
        //刷新opacity
        if (this.usingOpacity == ShowType.TurnOn) {
            itemNode.opacity = this.unSelectOpacity + percent * (this.selectOpacity - this.unSelectOpacity);
        }
    }

    /**
     * 获取当前被选中的节点
     * @returns 返回对应的节点
     */
    public getCurrentSelectNode(): cc.Node {
        return this._currentSelectNode;
    }

    /**
     * 设置被选中的节点
     * @param selectNode 
     */
    private setCurrentSelectNode(selectNode: cc.Node) {
        this._currentSelectNode = selectNode;
        if(!this._currentSelectNode.getComponent(ListViewCtrItemBase)){
            console.error("item的节点没有挂载继承ListViewCtrItemBase的组件，请检查")
        }
        this._currentSelectNode.getComponent(ListViewCtrItemBase).updateItem(this._itemDataList[this._currentIndex]);
    }


    //====================================================Private Function

    /**
     * 设置中间的位置
     * @param pos 位置
     */
    private _setCenterPos() {
        if (this._itemShowCount % 2 == 0) {//如果是偶数，则需要判断取哪个来进行选中
            this._centerPos = Math.floor(this._itemShowCount / 2) - 1;
        } else { //如果是奇数，直接是中间的选中既可，
            this._centerPos = Math.floor(this._itemShowCount / 2);
        }
    }

    /**
     * 向左滑动是更新左右指针
     */
    private _refreshScrollLeftPointer() {
        this._reduceLeftPointer();
        this._reduceRightPointer();
    }
    /**
     *  向右滑动是更新左右指针
     */
    private _refreshScrollRightPointer() {
        this._addRightPointer();
        this._addLeftPointer();
    }
    /**左侧指针增加一 */
    private _addLeftPointer() {
        if (this._leftPointer == this._itemDataList.length - 1) {
            this._leftPointer = 0;
        } else {
            this._leftPointer += 1;
        }
    }
    /**左侧指针减小一 */
    private _reduceLeftPointer() {
        if (this._leftPointer == 0) {
            this._leftPointer = this._itemDataList.length - 1;
        } else {
            this._leftPointer -= 1;
        }
    }
    /**右侧指针增加一 */
    private _addRightPointer() {
        if (this._rightPointer == this._itemDataList.length - 1) {
            this._rightPointer = 0;
        } else {
            this._rightPointer += 1;
        }
    }
    /**右侧指针减小一 */
    private _reduceRightPointer() {
        if (this._rightPointer == 0) {
            this._rightPointer = this._itemDataList.length - 1;
        } else {
            this._rightPointer -= 1;
        }
    }

    /**
     * 设置当前选中的index
     * @param selectIndex 
     */
    private _setCurrentSelect(selectIndex: number) {
        if (selectIndex == null) {
            this._currentIndex = 0;
        } else {
            this._currentIndex = selectIndex;
        }
    }

    private _addCurrentSelect() {
        this._currentIndex = this._currentIndex == this._itemDataList.length - 1 ? 0 : this._currentIndex + 1;
        this._setCurrentSelect(this._currentIndex);
    }

    private _reduceCurrentSelect() {
        this._currentIndex = this._currentIndex == 0 ? this._itemDataList.length - 1 : this._currentIndex - 1;
        this._setCurrentSelect(this._currentIndex);
    }

    /**
     * 初始化对象池
     */
    private _initNodePool() {
        this._itemNodePool = new cc.NodePool();
        for (let i = 0; i < this._itemShowCount; i++) {
            let tempNode = cc.instantiate(this.prefabItem);
            this._itemNodePool.put(tempNode);
        }
    }

    /**
     * 响应滑动事件，玩家滑动
     */
    private _onEventScrollRollingSlide() {
        let currentOffset = Math.round(Math.abs(this.scrollView.getScrollOffset().x));
        if (currentOffset <= this._leftOffset) {
            this._scrollToLeftAddNextItem();
        } else if (currentOffset >= this._rightOffset) {
            this._scrollToRightAddNextItem();
        }
    }

    /**
     * 刷新content中每一个节点的展示
     */
    private _refreshContentItemNodeList() {
        for (let i = 0; i < this.scrollView.content.childrenCount; i++) {
            let itemNode = this.scrollView.content.children[i];
            let worldPos = itemNode.parent.convertToWorldSpaceAR(itemNode.position);
            let targetPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
            let percent: number = 0;
            if (Math.abs(targetPos.x) < (this.prefabItem.data.width + this.spacing) * this.ratio) {
                percent = 1 - Math.abs(targetPos.x) / ((this.prefabItem.data.width + this.spacing) * this.ratio);
            } else {
                percent = 0;
            }
            this.refreshRollingShow(this.scrollView.content.children[i], percent);
            this._refreshRollingzIndex(this.scrollView.content.children[i], targetPos.x);
        }
    }

    /**
    * 向右滑动到下一个
    */
    private _scrollToRightAddNextItem() {
        let itemLeft = this._itemList.shift();
        this._itemNodePool.put(itemLeft);
        let itemNode = this._generateItem();
        itemNode.getComponent(ListViewCtrItemBase).init(this._itemDataList[this._rightPointer], this._rightPointer, this._currentIndex);
        this.setItemUnSelect(itemNode);
        this._addItemRight(itemNode);
        this._setContentOffset();
        this._refreshItemPosition();
    }

    /**
     * 向左滑动到下一个
     */
    private _scrollToLeftAddNextItem() {
        let itemRight = this._itemList.pop();
        this._itemNodePool.put(itemRight);
        let itemNode = this._generateItem();
        itemNode.getComponent(ListViewCtrItemBase).init(this._itemDataList[this._leftPointer], this._leftPointer, this._currentIndex);
        this.setItemUnSelect(itemNode);
        this._addItemLeft(itemNode);
        this._setContentOffset();
        this._refreshItemPosition();
    }

    /**刷新item的显示 */
    private _refreshItemPosition() {
        for (let i = 0; i < this._itemList.length; i++) {
            let item = this._itemList[i];
            item.setPosition(item.width * (0.5 + i) + this.spacing * i, 0);
            if (this._centerPos == i) {
                this.setCurrentSelectNode(item);
            }
        }
    }

    /**
     * 刷新item对应的zIndex
     * @param itemNode 
     * @param targetPosX 
     */
    private _refreshRollingzIndex(itemNode: cc.Node, targetPosX: number) {
        let baseSpacing: number = (this.prefabItem.data.width + this.spacing) * this.ratio / 2;
        if (Math.round(Math.abs(targetPosX)) < baseSpacing) {
            itemNode.zIndex = 100;
        } else if (Math.round(Math.abs(targetPosX)) < (this.prefabItem.data.width + this.spacing) + baseSpacing) {
            itemNode.zIndex = 10;
        } else if (Math.round(Math.abs(targetPosX)) < (this.prefabItem.data.width + this.spacing) * 2 + baseSpacing) {
            itemNode.zIndex = 1;
        } else {
            itemNode.zIndex = 0;
        }
    }

    /**
     * 初始化item的数据
     */
    _setContentItemData() {
        // let centerPos: number = null;
        // if (this._itemShowCount % 2 == 0) {//如果是偶数，则需要判断取哪个来进行选中
        //     centerPos = Math.floor(this._itemShowCount / 2) - 1;
        //     this._initContentItemData(centerPos);
        // } else { //如果是奇数，直接是中间的选中既可，
        //     centerPos = Math.floor(this._itemShowCount / 2);
        //     this._initContentItemData(centerPos);
        // }           
        this._initContentItemData(this._centerPos);
    }
    /**
     * 初始化每个item的数据
     * @param centerPos 中间位置的数据
     */
    _initContentItemData(centerPos: number) {
        this._leftPointer = this._currentIndex;
        this._rightPointer = this._currentIndex;
        let itemNode = this._itemList[centerPos];
        itemNode.getComponent(ListViewCtrItemBase).init(this._itemDataList[this._currentIndex], this._currentIndex, this._currentIndex);
        let leftP = centerPos - 1;
        let rightP = centerPos + 1;
        while (leftP >= 0) {
            let itemNode = this._itemList[leftP];
            this._reduceLeftPointer();
            itemNode.getComponent(ListViewCtrItemBase).init(this._itemDataList[this._leftPointer], this._leftPointer, this._currentIndex);
            leftP -= 1;
        }
        while (rightP < this._itemShowCount) {
            let itemNode = this._itemList[rightP];
            this._addRightPointer();
            itemNode.getComponent(ListViewCtrItemBase).init(this._itemDataList[this._rightPointer], this._rightPointer, this._currentIndex);
            rightP += 1;
        }
    }


    /**
     * 获取下一个左侧数字
     * @param current 当前的数字
     * @returns 
     */
    _nextLeftNumber(current: number) {
        let result: number = null;
        if (current == 0) {
            result = this._itemShowCount - 1;
        } else {
            result = current - 1;
        }
        return result;
    }

    /**
     * 获取下一个右侧数字
     * @param current 当前的数字
     * @returns 
     */
    _nextRightNumber(current: number) {
        let result: number = null;
        if (current == this._itemShowCount - 1) {
            result = 0;
        } else {
            result = current + 1;
        }
        return result;
    }

    /**
     * 设置content的具体偏移量
     */
    _setContentOffset() {
        let content = this.scrollView.content;
        content.width = this.prefabItem.data.width * this._itemShowCount + this.spacing * (this._itemShowCount - 1);
        if (this._itemShowCount % 2 == 0) {
            this._setEventContentOffset();
        } else {
            this._setOddContentOffset();
        }
    }

    /**
     * 设置item数量为奇数是content的偏移
     */
    _setOddContentOffset() {
        let endPosX: number = this.scrollView.getMaxScrollOffset().x / 2;
        this.scrollView.scrollToOffset(cc.v2(endPosX, 0));
        this._leftOffset = endPosX - (this.prefabItem.data.width + this.spacing);
        this._rightOffset = endPosX + (this.prefabItem.data.width + this.spacing);
    }

    /**
    * 设置item数量为偶数是content的偏移
    */
    _setEventContentOffset() {
        let endPosX: number = this.scrollView.getMaxScrollOffset().x / 2;
        endPosX = endPosX - (this.prefabItem.data.width + this.spacing) / 2;
        this._leftOffset = endPosX - (this.prefabItem.data.width + this.spacing);
        this._rightOffset = endPosX + (this.prefabItem.data.width + this.spacing);
        this.scrollView.scrollToOffset(cc.v2(endPosX, 0));
    }

    /**
     * 设置content的具体展示
     */
    _setContentItem() {
        this._initContentItem(this._centerPos);
    }

    /**
     * 生成content预制体，并且放置到对应的位置上
     * @param centerPos 中间的位置
     */
    _initContentItem(centerPos: number) {
        let itemNode = this._initItemByPos(centerPos);
        this.setItemSelect(itemNode);
        this.setCurrentSelectNode(itemNode);
        this._addItemRight(itemNode);
        let leftP = centerPos - 1;
        let rightP = centerPos + 1;
        while (leftP >= 0) {
            let itemNode = this._initItemByPos(leftP);
            this.setItemUnSelect(itemNode);
            leftP -= 1;
            this._addItemLeft(itemNode);
        }
        while (rightP < this._itemShowCount) {
            let itemNode = this._initItemByPos(rightP);
            this.setItemUnSelect(itemNode);
            rightP += 1;
            this._addItemRight(itemNode);
        }
    }

    /**
     * 实例化item并将其添加到content中，设置其具体的位置
     * @param itemPos item的位置
     */
    _initItemByPos(itemPos: number): cc.Node {
        let itemNode = this._generateItem();
        itemNode.setPosition(itemNode.width * (0.5 + itemPos) + this.spacing * itemPos, 0);
        return itemNode;
    }

    /**
     * 初始化item的节点
     * @returns 返回具体的节点
     */
    _generateItem() {
        let itemNode: cc.Node = null;
        if (this._itemNodePool.size() > 0) {
            itemNode = this._itemNodePool.get();
        } else {
            itemNode = cc.instantiate(this.prefabItem)
        }
        itemNode.parent = this.scrollView.content;
        return itemNode;
    }

    /**左侧添加一个节点 */
    _addItemLeft(itemNode: cc.Node) {
        this._itemList.unshift(itemNode);
    }
    /**右侧添加一个节点 */
    _addItemRight(itemNode: cc.Node) {
        this._itemList.push(itemNode);
    }
}
