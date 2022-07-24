import {MeshLoader} from "./MeshLoader.js";
let meshlist = [];
let gl;
export class Engine{
    constructor (id)
    {
        console.debug("Engine booting up...")
        this.canvas = document.getElementById(id);
        this.gl = this.canvas.getContext("webgl");
        if(!this.gl){
            alert("This browser does not support opengl acceleration.")
            return;
        }
        this.meshlist = [];
        this.loader = new MeshLoader(this.meshlist)
        meshlist = this.meshlist;
        gl = this.gl
    }

    async load_scene(scene){
        console.debug(" Loading scene...")
        for(const obj of scene.objs){
            await this.loader.load(obj.path, this.gl, obj.player, obj.active, obj.coords, obj.alias)
        }
        console.debug(" Scene loaded.")
        meshlist = this.meshlist;
    }


}
export async function render(){
    let program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"])
    gl.useProgram(program);
    await meshlist.forEach(elem => {
        elem.compute_phys(meshlist)
    })
    await meshlist.forEach(elem => {
        elem.render(gl, {ambientLight: [0.2, 0.2, 0.2], colorLight: [1.0, 1.0, 1.0]}, program);
    })
    requestAnimationFrame(render)
}