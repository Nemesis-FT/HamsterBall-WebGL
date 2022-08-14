let queue = {x:{p:false, n:false}, z:{p:false, n:false}};
let obj = null;

export class PlayerController{

    constructor(object) {
        this.object = object;
        obj = object
        this.install();
    }

    install(){
        window.addEventListener("keydown", this.keyDown, true)
        window.addEventListener("keyup", this.keyUp, true)
        console.debug("Controller installed.")
        window.requestAnimationFrame(handler)
    }

    uninstall(){
        window.removeEventListener("keydown", this.keyDown);
        window.removeEventListener("keyup", this.keyUp)
    }



    keyDown(e){
        console.debug(e)
        if(e.keyCode === 87) queue.x.p=true;
        if(e.keyCode === 83) queue.x.n=true;
        if(e.keyCode === 65) queue.z.p=true;
        if(e.keyCode === 68) queue.z.n=true;
    }

    keyUp(e){
        if(e.keyCode === 87) queue.x.p=false;
        if(e.keyCode === 83) queue.x.n=false;
        if(e.keyCode === 65) queue.z.p=false;
        if(e.keyCode === 68) queue.z.n=false;
    }
}

function handler(){
    if(queue.x.p){
        obj.accel.x=0.0005
    }
    if(queue.x.n){
        obj.accel.x= -0.0005
    }
    if(queue.z.p){
        obj.accel.z= -0.0005
    }
    if(queue.z.n){
        obj.accel.z= 0.0005
    }
    window.requestAnimationFrame(handler)
}