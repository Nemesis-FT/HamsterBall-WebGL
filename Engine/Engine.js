import {MeshLoader} from "./MeshLoader.js";
import {UI} from "./UI/UI.js"
import {Button} from "./UI/Button.js"
import {LevelSelectButton} from "./UI/LevelSelectButton.js";
import {StartButton} from "./UI/StartButton.js";


let ui;
let btn
let btn1
let btn2
let levels = ["level1.json", "level2.json"]
let offset = 0;

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

export class Engine {
    constructor(id) {
        this.curr_time = 0;
        this.meshlist = []
        this.gl = null;
        this.ext = null;
        this.time_offset = 0;
        this.scene_curr=null;
        this.code = Math.floor(Math.random() * 10);
        console.debug("SlingShot Engine booting up...")
        this.canvas = document.getElementById(id);
        this.die = false;
        this.nextlevel = "";
        this.advance_timer = true;
        window.addEventListener('loadlevel_pre', async (e) =>{
            this.die = true
            this.nextlevel = e.detail.scene
        })
        window.addEventListener('level_complete', async (e) =>{
            this.advance_timer = false;
            ui.draw('18pt Calibri', "black", {x: this.gl.canvas.width / 2, y: 20}, "Level completed in "+ this.curr_time-this.time_offset+"s.")
            delay(5000).then(setTimeout(function(){
                window.location.reload();
            },1000));

        })
        this.gl = this.canvas.getContext("webgl", {antialias: true});

        if (!this.gl) {
            alert("This browser does not support opengl acceleration.")
            return;
        }
        this.ext = this.gl.getExtension('WEBGL_depth_texture');
        if (!this.ext) {
            alert("This system does not support the Depth Texture Extension.")
            return;
        }
        this.meshlist = [];
        this.scene = null;
        this.loader = new MeshLoader(this.meshlist)
        this.meshlist = this.meshlist;
        this.gl = this.gl
        this.ui = new UI("ui")
        ui = this.ui
        this.btn = new LevelSelectButton("", {
            coordinates: {x: this.gl.canvas.width / 2, y: this.gl.canvas.height / 2},
            width: 500,
            height: 50
        }, ui.canvas, ui.ctx, ["Standard Race", "Ramp Race"])
        this.btn1 = new StartButton("Start", {
            coordinates: {x: this.gl.canvas.width / 2 - this.btn.geometry.width/4-10, y: this.btn.geometry.height+this.gl.canvas.height / 2+10},
            width: 230,
            height: 50
        }, ui.canvas, ui.ctx, this.btn.idx, levels)
        this.btn2 = new Button("Disable Advanced Rendering", {
            coordinates: {x: this.gl.canvas.width / 2 + this.btn.geometry.width/4+10, y: this.btn.geometry.height+this.gl.canvas.height / 2+10},
            width: 230,
            height: 50
        }, ui.canvas, ui.ctx)
    }

    async load_scene(scene) {
        this.scene = scene;
        this.scene_curr = scene;
        console.debug(" Loading scene...")
        for (const obj of scene.objs) {
            await this.loader.load(obj.path, this.gl, obj.player, obj.active, obj.coords, obj.alias, obj.collider)
        }
        console.debug(" Scene loaded.")
    }

    render = (time = 0) => {
        console.debug(time, this.curr_time, offset)

        if(time === 0){
            if(this.scene_curr.name!=="menu"){
                this.btn.disable()
                this.btn1.disable()
                this.btn2.disable()
            }
            else{
                this.btn.enable()
                this.btn1.enable()
                this.btn2.enable()
            }
        }
        this.btn1.levelId = this.btn.idx;
        let program = webglUtils.createProgramFromScripts(this.gl, ["3d-vertex-shader", "3d-fragment-shader"])
        this.gl.useProgram(program);
        if (this.scene_curr.phys && !this.die) {
            this.meshlist.forEach(elem => {
                elem.compute_phys(this.meshlist)
            })
        }
        this.delta = time - this.curr_time;
        let camera_coords = this.find_actor_coords()
        if(!this.die) {
            this.meshlist.forEach(elem => {
                elem.render(this.delta, this.gl, {
                    ambientLight: [0.2, 0.2, 0.2],
                    colorLight: [1.0, 1.0, 1.0]
                }, program, camera_coords);
            })
        }
        if (this.scene_curr.name !== "menu") {

            if(this.advance_timer) {
                this.curr_time = time-offset;
            }
            ui.clear()
            ui.draw('18pt Calibri', "black", {x: this.gl.canvas.width / 2, y: 20}, this.scene_curr.name)
            ui.draw('18pt Calibri', "black", {x: this.gl.canvas.width / 2, y: 40}, ((this.curr_time) / 1000).toFixed(3))
            if(!this.advance_timer){
                ui.draw('18pt Calibri', "red", {x: this.gl.canvas.width / 2, y: 60}, "Level complete!")
            }
        } else {
            ui.clear()
            this.btn.draw()
            this.btn1.draw()
            this.btn2.draw()
            offset = time
            ui.draw('14pt Calibri', "black", {
                x: this.gl.canvas.width / 2,
                y: this.gl.canvas.height /2 -30
            }, "Click on the button below to choose a level, then click on start.")
            ui.draw('14pt Calibri', "black", {
                x: this.gl.canvas.width / 2,
                y: this.gl.canvas.height - 30
            }, "Powered by SlingShot Engine.")
            ui.draw('14pt Calibri', "black", {
                x: this.gl.canvas.width / 2,
                y: this.gl.canvas.height - 15
            }, "This program and its engine were developed by Lorenzo Balugani.")
            ui.draw('14pt Calibri', "black", {
                x: this.gl.canvas.width / 2,
                y: this.gl.canvas.height
            }, "This is not a commercial product. The hamsterball trademark is property of Raptisoft.")
        }
        if (!this.die) {
            this.animId = window.requestAnimationFrame(this.render)
        } else {
            console.debug("Killing engine...")
            window.dispatchEvent(new CustomEvent('loadlevel', { detail:{scene: this.nextlevel}}))
            this.meshlist = []
            this.curr_time = -1
            window.cancelAnimationFrame(this.animId)
        }

    }

    find_actor() {
        let actor = null;
        for (let i = 0; i < this.meshlist.length; i++) {
            if (this.meshlist[i].isPlayer) {
                actor = this.meshlist[i]
                break;
            }
        }
        return actor;
    }

    find_actor_coords() {
        let actor = this.find_actor()
        if(!actor){
            return [0,0,0]
        }
        if(this.scene_curr.name !=="menu"){
            return [actor.mesh.positions[0], actor.mesh.positions[1], actor.mesh.positions[2]]
        }
        return [actor.position.x, actor.position.z, actor.position.y]
    }



}