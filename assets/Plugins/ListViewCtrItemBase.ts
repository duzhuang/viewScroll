const { ccclass, property } = cc._decorator;

/**
 * item需要继承基类
 * init(data) 初始化函数 data是item的数据
 * update(data) 当对应的item的被选中的时候会调用此函数 data是item的数据
 */
@ccclass
export default class ListViewCtrItemBase extends cc.Component {

    protected onLoad(): void {
        this.node.on("changeCurrentSelectIndex", this.onEventSelectIndex,this);
    }

    private onEventSelectIndex(){
        console.log("子节点是否可以接收到")
    }
   
    /**
     * 初始化item的显示
     * @param data item的数据
     * @param index item的index
     * @param currentSelect 当前选中的item
     */
    init(data: any, index: number, currentSelect: number) {

    }

    /**
     * 被选中时刷新
     * @param data 
     */
    updateItem(data:any){

    }
}