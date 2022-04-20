const { ccclass, property } = cc._decorator;

@ccclass
export default class ListViewCtr extends cc.Component {

    @property({ type: cc.Node, tooltip: '' })
    content: cc.Node = null;

    @property({ type: cc.Node, tooltip: '' })
    prefabItem: cc.Node = null;

    @property({ type: cc.Integer, tooltip: '' })
    spacing = 0;

    @property({ type: cc.SpriteFrame, tooltip: '' })
    sprList: cc.SpriteFrame[] = [];

    @property({ type: cc.ScrollView, tooltip: '' })
    scrollView: cc.ScrollView = null;

    @property({ type: cc.Integer, tooltip: '' })
    showCount = 3;

    private _totalCount: number = 6;

    private _items: cc.Node[] = [];

    private _itemId: number = 0;

    private _leftOffset: number = null;
    private _rightOffset: number = null;

    private _scaleSize: number = 0.8;

    private _lastIndex: number = this._totalCount;

    private _leftPointer: number = null;;
    private _rightPointer: number = null;

    private _itemData = [
        {
            index: 1
        },
        {
            index: 2
        },
        {
            index: 3
        },
        {
            index: 4
        },
        {
            index: 5
        },
        {
            index: 6
        }
    ]

    protected onLoad(): void {
        this.scrollView.node.on('scrolling', this.onScrollRolling, this);
    }

    protected start(): void {
        this.content.width = (this.prefabItem.width + this.spacing) * this._totalCount + this.spacing;
        for (let i = 0; i < this._totalCount; ++i) {
            let item = cc.instantiate(this.prefabItem);
            item.getComponent(cc.Sprite).spriteFrame = this.sprList[i];
            item.getComponentInChildren(cc.Label).string = this._itemId++ + "";
            item.name = this._itemId + "";
            item.parent = this.content;
            item.setPosition(item.width * (0.5 + i) + this.spacing * (i + 1), 0);
            this._items.push(item);
        }

        this.content.setPosition(new cc.Vec2(-425, 0));

        this._leftOffset = -this.scrollView.node.width / 2;
        this._rightOffset = -this.content.width - this._leftOffset;

        this.setPointer();
    }

    setPointer() {
        this._leftPointer = 0;
        this._rightPointer = 5;
        console.log("左侧指针",this._leftPointer);
        console.log("右侧指针",this._rightPointer);
    }
    /**减小 左侧指针 */
    reduceLeftPointer() {
        if (this._leftPointer == 0) {
            this._leftPointer = this._totalCount - 1;
        } else {
            this._leftPointer--;
        }
        console.log("左侧指针",this._leftPointer);
    }
    /**增加 左侧指针 */
    addLeftPointer(){
        if (this._leftPointer == this._totalCount - 1) {
            this._leftPointer = 0;
        } else {
            this._leftPointer++;
        }
        console.log("左侧指针",this._leftPointer);
    }
    /**增加  右侧指针 */
    addRightPointer() {
        if (this._rightPointer == this._totalCount - 1) {
            this._rightPointer = 0;
        } else {
            this._rightPointer++;
        }
        console.log("右侧指针",this._rightPointer);
    }
    /**减小 右侧指针 */
    reduceRightPointer(){
        if (this._rightPointer == 0) {
            this._rightPointer = this._totalCount - 1;
        } else {
            this._rightPointer--;
        }
        console.log("右侧指针",this._rightPointer);
    }


    /**响应滑动事件 */
    onScrollRolling(scrollView) {
        let pos = this.content.position.x;
        if (pos > this._leftOffset - this.prefabItem.width - this.spacing) { //左边的边界值            
            this.reduceLeftPointer();
            this.onClickAddLeft();
            this.onClickReduceRight();
            this.reduceRightPointer();
        } else if (pos < (this._rightOffset + this.prefabItem.width + this.spacing)) { //右边的边界值                           
            this.addRightPointer()
            this.onClickAddRight();
            this.onClickReduceLeft();
            this.addLeftPointer();
        }
        this._refreshItemScale();
        this._refreshItemIndex();
        this._refreshItemAlpha();
    }

    onClickReduceRight() {
        let itemRight = this._items.pop();
        itemRight.destroy();
        this._refreshContentWidth();
        this._refreshItemPosition();
    }

    onClickReduceLeft() {
        let itemLeft = this._items.shift();
        itemLeft.destroy();
        this._refreshContentWidth();
        this.content.setPosition(this.content.position.x + this.prefabItem.width + this.spacing, 0);
        this._refreshItemPosition();
    }

    onClickAddRight() {
        let item = cc.instantiate(this.prefabItem);       
        let itemData = this._itemData[this._rightPointer];        
        item.getComponent(cc.Sprite).spriteFrame = this.sprList[itemData.index - 1];
        item.getComponentInChildren(cc.Label).string = this._itemId++ + "";
        item.name = this._itemId + "";
        item.parent = this.content;
        this._items.push(item);
        this._refreshContentWidth();
        this._refreshItemPosition();
    }

    onClickAddLeft() {
        let item = cc.instantiate(this.prefabItem);        
        let itemData = this._itemData[this._leftPointer];        
        item.getComponent(cc.Sprite).spriteFrame = this.sprList[itemData.index-1];
        item.getComponentInChildren(cc.Label).string = this._itemId++ + "";
        item.name = this._itemId + "";
        item.parent = this.content;
        this._items.unshift(item);
        this._refreshContentWidth();
        this.content.setPosition(this.content.position.x - this.prefabItem.width - this.spacing, 0);
        this._refreshItemPosition();
    }

    /**刷新item的显示 */
    _refreshItemPosition() {
        for (let i = 0; i < this._items.length; i++) {
            let item = this._items[i];
            item.setPosition(item.width * (0.5 + i) + this.spacing * (i + 1), 0);
        }
    }

    /**刷新content宽度 */
    _refreshContentWidth() {
        this.content.width = this._items.length * (this.prefabItem.width + this.spacing) + this.spacing;
    }

    /**刷新缩放 */
    _refreshItemScale() {
        for (let i = 0; i < this.content.childrenCount; i++) {
            let itemNode = this.content.children[i];
            let worldPos = itemNode.parent.convertToWorldSpaceAR(itemNode.position);
            let targetPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
            if (Math.abs(targetPos.x) < this.prefabItem.width) {
                itemNode.scale = this._scaleSize + (1 - this._scaleSize) - (1 - this._scaleSize) * (Math.abs(targetPos.x) / this.prefabItem.width)
            } else {
                itemNode.scale = this._scaleSize;
            }
        }
    }

    /**刷新zindex */
    _refreshItemIndex() {
        for (let i = 0; i < this.content.childrenCount; i++) {
            let itemNode = this.content.children[i];
            let worldPos = itemNode.parent.convertToWorldSpaceAR(itemNode.position);
            let targetPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
            if (Math.abs(targetPos.x) < this.prefabItem.width / 2) {
                itemNode.zIndex = this._lastIndex;
            }
        }
    }

    /**刷新透明度 */
    _refreshItemAlpha() {
        for (let i = 0; i < this.content.childrenCount; i++) {
            let itemNode = this.content.children[i];
            let worldPos = itemNode.parent.convertToWorldSpaceAR(itemNode.position);
            let targetPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
            if (Math.abs(targetPos.x) < this.prefabItem.width / 2) {
                itemNode.opacity = 255;
            } else {
                itemNode.opacity = 125;
            }
        }
    }

    /**获取中心点的位置 */
    private getContentCenterPosX() {
        return this.content.width / 2;
    }

}
