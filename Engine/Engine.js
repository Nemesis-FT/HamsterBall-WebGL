import {MeshLoader} from "./MeshLoader.js";

let meshlist = [];
let gl;
let scene_curr;

export class Engine {
    constructor(id) {
        console.debug("Engine booting up...")
        this.canvas = document.getElementById(id);
        this.gl = this.canvas.getContext("webgl");
        if (!this.gl) {
            alert("This browser does not support opengl acceleration.")
            return;
        }
        this.meshlist = [];
        this.scene = null;
        this.loader = new MeshLoader(this.meshlist)
        meshlist = this.meshlist;
        gl = this.gl
    }

    async load_scene(scene) {
        this.scene = scene;
        scene_curr = scene;
        console.debug(" Loading scene...")
        for (const obj of scene.objs) {
            await this.loader.load(obj.path, this.gl, obj.player, obj.active, obj.coords, obj.alias)
        }
        console.debug(" Scene loaded.")
        meshlist = this.meshlist;
    }


}

let curr_time = 0;

export async function render(time = 0) {
    let program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"])
    gl.useProgram(program);
    if (time - curr_time > 10) {
        await meshlist.forEach(elem => {
            elem.compute_phys(meshlist)
        })
        curr_time = time
    }
    await meshlist.forEach(elem => {
        elem.render(gl, {ambientLight: [0.2, 0.2, 0.2], colorLight: [1.0, 1.0, 1.0]}, program, find_actor_coords());
    })

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    function computeMatrix(viewProj, translation, rotX, rotY) {
        let matrix = m4.translate(viewProj, translation[0], translation[1], translation[2])
        matrix = m4.xRotate(matrix, rotX)
        return m4.yRotate(matrix, rotY)
    }

    requestAnimationFrame(render)
}

function find_actor_coords() {
    let actor = null;
    for (let i = 0; i < meshlist.length; i++) {
        if (meshlist[i].isPlayer) {
            actor = meshlist[i]
            break;
        }
    }
    return [actor.mesh.positions[0], actor.mesh.positions[1], actor.mesh.positions[2]]
}