import {Button} from "./Button.js";

export class MirrorButton extends Button{
    constructor(geometry, canvas, ctx, textOff, textOn) {
        super(textOff, geometry, canvas, ctx);
        this.textOn=textOn
        this.textOff=textOff
        this.offset = 0
        this.value = false;
    }


    handle = e =>{
        if(super.collision(super.normalize(e))){
            this.value=!this.value
            if(this.value){
                this.text=this.textOn
            }
            else{
                this.text=this.textOff
            }
        }
    }
}