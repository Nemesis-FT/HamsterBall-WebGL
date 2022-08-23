import {Button} from "./Button.js";

export class LevelSelectButton extends Button{
    constructor(text, geometry, canvas, ctx, levelList) {
        super(levelList[0], geometry, canvas, ctx);
        this.levelList = levelList;
        this.idx = 0;
    }


    handle = e =>{
        if(super.collision(super.normalize(e))){
            this.idx++;
            if(this.idx<this.levelList.length){
                this.text = this.levelList[this.idx];
            }
            else{
                this.idx = 0;
                this.text = this.levelList[this.idx];
            }
        }
    }
}