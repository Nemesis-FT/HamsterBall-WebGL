let queue = [];
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
    }

    uninstall(){
        window.removeEventListener("keydown", this.keyDown);
        window.removeEventListener("keyup", this.keyUp)
    }

    keyDown(e){
        if(e.keyCode === 87) if(!queue.includes("w")) {queue.push("w");obj.accel.x=0.0005};
        if(e.keyCode === 83) if(!queue.includes("s")) {queue.push("s");obj.accel.x=-0.0005};
        if(e.keyCode === 65) if(!queue.includes("a"))queue.push("a");
        if(e.keyCode === 68) if(!queue.includes("d"))queue.push("d");
    }

    keyUp(e){
        if(e.keyCode === 87) queue.splice(queue.indexOf("w"),1);
        if(e.keyCode === 83) queue.splice(queue.indexOf("s"),1);
        if(e.keyCode === 65) queue.splice(queue.indexOf("a"),1);
        if(e.keyCode === 68) queue.splice(queue.indexOf("d"),1);
    }
}