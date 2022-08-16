let queue = {x:{p:false, n:false}, z:{p:false, n:false}};
let obj = null;
let canvas = null;
let drag = false;
let gyro = null;

export class PlayerController{

    constructor(object) {
        this.object = object;
        obj = object
        canvas = document.getElementById("screen");
        this.install();
    }

    install(){
        window.addEventListener("keydown", this.keyDown, true)
        window.addEventListener("keyup", this.keyUp, true)
        canvas.addEventListener("mousedown", this.mouseDown, true)
        canvas.addEventListener("mouseup", this.mouseUp, true)
        canvas.addEventListener("mousemove", this.mouseMove, true)
        let button = document.getElementById("gyro");
        button.addEventListener("click", this.enableGyro, true)
        console.debug("Controller installed.")
        window.requestAnimationFrame(handler)
    }

    uninstall(){
        window.removeEventListener("keydown", this.keyDown);
        window.removeEventListener("keyup", this.keyUp)
    }

    enableGyro(){
        if(window.DeviceMotionEvent)
            window.addEventListener("devicemotion", this.gyro, true)
        else alert("Motion sensors not available on device.")
    }

    disableGyro(){
        window.removeEventListener("devicemotion")
    }

    gyro(e){
        console.debug(e.acceleration.x, e.acceleration.y)
        if(e.acceleration.x>0){
            queue.x.p=true;
        }
        else if(e.acceleration.x<0){
            queue.x.n=true;
        }
        else queue.x.n = queue.x.p=false
        if(e.acceleration.y<0){
            queue.z.p = true;
        }
        else if(e.acceleration.y>0){
            queue.z.n = true;
        }
        else queue.z.p = queue.z.n = false
    }

    mouseMove(e){
        if(drag){
            console.debug(e.movementX, e.movementY)
            if(e.movementX>0){
                queue.x.p=true;
            }
            else if(e.movementX<0){
                queue.x.n=true;
            }
            else queue.x.n = queue.x.p=false
            if(e.movementY<0){
                queue.z.p = true;
            }
            else if(e.movementY>0){
                queue.z.n = true;
            }
            else queue.z.p = queue.z.n = false
        }
    }

    mouseDown(e){
        console.debug(e.movementX,e.movementY)
        drag = true;

    }

    mouseUp(e){
        drag = false;
        queue.z.p = queue.z.n = queue.x.n = queue.x.p=false
    }



    keyDown(e){
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