import {Button} from "./Button.js";

export class StartButton extends Button{
    constructor(text, geometry, canvas, ctx, levelId, levels) {
        super(text, geometry, canvas, ctx);
        this.levelId = levelId
        this.levels = levels;
        this.offset = 0
    }


    handle = e =>{
        if(super.collision(super.normalize(e)) && this.enabled){
            console.debug(this.enabled)
            let scene = "Menu.json";
            window.dispatchEvent(new CustomEvent('loadlevel_pre', { detail:{scene: this.levels[this.levelId]}}))
        }
    }
}