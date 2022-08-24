let queue = {x:{p:false, n:false}, z:{p:false, n:false}};
let obj = null;
let canvas = null;
let drag = false;
let gyro = null;
let old = {x:null, y:null};

export class PlayerController{

    constructor(object) {
        this.object = object;
        obj = object
        canvas = document.getElementById("ui");
        this.install();
    }

    install(){
        window.addEventListener("keydown", this.keyDown, true)
        window.addEventListener("keyup", this.keyUp, true)
        window.addEventListener("mousedown", this.mouseDown, true)
        window.addEventListener("mouseup", this.mouseUp, true)
        window.addEventListener("mousemove", this.mouseMove, true)
        window.addEventListener("touchstart", this.mouseDown, true)
        window.addEventListener("touchend", this.mouseUp, true)
        window.addEventListener("touchmove", this.mouseMove)
        console.debug("Controller installed.")
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
        alert()
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
            if(e instanceof TouchEvent){
                e = e.changedTouches[0]
                if(e.clientX>old.x){
                    queue.x.p=true;
                }
                else if(e.clientX<old.x){
                    queue.x.n=true;
                }
                else queue.x.n = queue.x.p=false
                if(e.clientY<old.y){
                    queue.z.p = true;
                }
                else if(e.clientY>old.y){
                    queue.z.n = true;
                }
                else queue.z.p = queue.z.n = false
                old.x = e.clientX;
                old.y = e.clientY;
            }
            else{
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
    }

    mouseDown(e){
        if(e instanceof TouchEvent){
        old.x = e.changedTouches[0].clientX;
        old.y = e.changedTouches[0].clientY;
        }
        drag = true;
    }

    mouseUp(e){
        drag = false;
        queue.z.p = queue.z.n = queue.x.n = queue.x.p=false
        old = {x:null, y:null};
    }



    keyDown(e){
        if(e.keyCode === 87) queue.x.p=true;
        if(e.keyCode === 83) queue.x.n=true;
        if(e.keyCode === 65) queue.z.p=true; // a
        if(e.keyCode === 68) queue.z.n=true; // d
        if(e.keyCode === 27) {setTimeout(function(){
            window.location.reload();
        })}
    }

    keyUp(e){
        if(e.keyCode === 87) queue.x.p=false;
        if(e.keyCode === 83) queue.x.n=false;
        if(e.keyCode === 65) queue.z.p=false;
        if(e.keyCode === 68) queue.z.n=false;
    }
    handler(){
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

    }
}
