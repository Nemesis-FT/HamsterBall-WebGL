import {Button} from "./Button.js";

export class ScreenButton extends Button{
    constructor(geometry, canvas, ctx, textOff, textOn) {
        super(textOff, geometry, canvas, ctx);
        this.textOn=textOn
        this.textOff=textOff
        this.offset = 0
        this.value = false;
    }


    handle = e =>{
        if(super.collision(super.normalize(e))&& this.enabled){
            this.value=!this.value
            if(this.value){
                this.text=this.textOn
                localStorage.setItem("screens", "true")
            }
            else{
                this.text=this.textOff
                localStorage.setItem("screens", "false")
            }
        }
    }

    update(){
        if(this.value){
            this.text=this.textOn
        }
        else{
            this.text=this.textOff
        }
    }
}