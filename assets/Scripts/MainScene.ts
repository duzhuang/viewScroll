import ListViewCtr from "../Plugins/ListViewCtrBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    @property({ type: ListViewCtr, tooltip: '' })
    ListViewCtr: ListViewCtr = null;

  

    @property({ type: cc.Node, tooltip: '', visible: false })
    tempNode: cc.Node = null;

    @property({type:cc.Prefab,tooltip:''})   
    _prefabItem: cc.Prefab = null;

    @property({type:cc.Prefab,tooltip:'2222'})
    set prefabItem(value){
        if(value){            
            this._prefabItem = value;
            this.tempNode = cc.instantiate(value);
            cc.log(this.tempNode);
        }
    }
    get prefabItem(){
        return this._prefabItem;
    }

 
    


    onLoad () {
        this.ListViewCtr.node.on("select-change-begin", this.onEventV,this);
    }

    start () {
        console.log("这是预制体的宽度",this._prefabItem.data.width);
    }

    onEventV(index){
        
    }

    onClickInit(){
        this.ListViewCtr.initListView([1, 2, 3, 4, 5, 6, 7], 3);
    }

    onClickLeft(){
        this.ListViewCtr.scrollToLeftNextItem(1);
    }

    onClickRight(){
        this.ListViewCtr.scrollToRightNextItem(1);
    }

    // update (dt) {}
}
