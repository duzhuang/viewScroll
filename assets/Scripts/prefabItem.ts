import ListViewCtrItemBase from "../Plugins/ListViewCtrItemBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class prefabItem extends ListViewCtrItemBase {

    @property(cc.Label)
    label: cc.Label = null;

    @property({ type: cc.Sprite, tooltip: '' })
    bgSpr: cc.Sprite = null;

    @property({ type: cc.SpriteFrame, tooltip: '' })
    sprList: cc.SpriteFrame[] = [];  

    private _itemData: any = null;

    start () {

    }

    init(data: any, index: number, currentSelect: number): void {      
        this._itemData = data;
        this.label.string = this._itemData;     
    }

    updateItem(data: any): void {
        
    }


    protected onDestroy(): void {
        
    }

    onClick(){
        console.log(this._itemData);
    }

    // update (dt) {}
}
