import {MeshLoader} from "./MeshLoader.js";
import {UI} from "./UI.js"

let meshlist = [];
let gl;
let ext;
let scene_curr;
let ui;

export class Engine {
    constructor(id) {
        console.debug("SlingShot Engine booting up...")
        this.canvas = document.getElementById(id);

        this.gl = this.canvas.getContext("webgl", {antialias: true});

        if (!this.gl) {
            alert("This browser does not support opengl acceleration.")
            return;
        }
        ext = this.gl.getExtension('WEBGL_depth_texture');
        if (!ext) {
            alert("This system does not support the Depth Texture Extension.")
            return;
        }
        this.meshlist = [];
        this.scene = null;
        this.loader = new MeshLoader(this.meshlist)
        meshlist = this.meshlist;
        gl = this.gl
        this.ui = new UI("ui")
        ui = this.ui
    }

    async load_scene(scene) {
        this.scene = scene;
        scene_curr = scene;
        console.debug(" Loading scene...")
        for (const obj of scene.objs) {
            await this.loader.load(obj.path, this.gl, obj.player, obj.active, obj.coords, obj.alias, obj.collider)
        }
        console.debug(" Scene loaded.")

        meshlist = this.meshlist;
    }

    kill() {
        scene_curr.die = true;
    }


}

let curr_time = 0;
let delta = 0;

export async function render(time = 0) {
    let program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"])
    gl.useProgram(program);
    if (scene_curr.phys) {
        meshlist.forEach(elem => {
            elem.compute_phys(meshlist)
        })
    }
    delta = time - curr_time;
    let camera_coords = find_actor_coords()
    console.debug(camera_coords)
    meshlist.forEach(elem => {
        elem.render(delta, gl, {
            ambientLight: [0.2, 0.2, 0.2],
            colorLight: [1.0, 1.0, 1.0]
        }, program, camera_coords);
    })
    if(scene_curr.name!=="menu"){
        ui.clear()
        ui.draw('18pt Calibri', "black", {x: gl.canvas.width / 2, y: 20}, scene_curr.name)
        ui.draw('18pt Calibri', "black", {x: gl.canvas.width / 2, y: 40}, (time / 1000).toFixed(3))
    }
    else{
        ui.draw('18pt Calibri', "black", {x: gl.canvas.width / 2, y: gl.canvas.height/ 2}, "Press the Start button to begin")
        ui.draw('14pt Calibri', "black", {x: gl.canvas.width / 2, y: gl.canvas.height-30}, "Powered by SlingShot Engine.")
        ui.draw('14pt Calibri', "black", {x: gl.canvas.width / 2, y: gl.canvas.height-15}, "This program and its engine were developed by Lorenzo Balugani.")
    }
    if (!scene_curr.die) {

        requestAnimationFrame(render)
    } else {
        console.debug("Killing engine...")
    }

}

function find_actor_coords() {
    let actor = null;
    for (let i = 0; i < meshlist.length; i++) {
        if (meshlist[i].isPlayer) {
            actor = meshlist[i]
            break;
        }
    }
    console.debug(actor.mesh.positions[0], actor.mesh.positions[1], actor.mesh.positions[2])
    return [actor.position.x, actor.position.z, actor.position.y]
}