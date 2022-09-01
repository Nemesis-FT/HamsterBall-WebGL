import {Button} from "./Button.js";

export class MainMenuButton extends Button{
    constructor(text, geometry, canvas, ctx) {
        super(text, geometry, canvas, ctx);
    }


    handle = e =>{
        if(super.collision(super.normalize(e))){
            setTimeout(function () {
                window.location.reload();
            }, 1)
        }
    }
}