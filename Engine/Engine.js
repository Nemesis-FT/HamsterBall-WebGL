import {MeshLoader} from "./MeshLoader.js";

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
    }

    async load_scene(scene){
        console.debug(" Loading scene...")
        for(const obj of scene.objs){
            await this.loader.load(obj, this.gl)
        }
        console.debug(" Scene loaded.")
    }

    async render(){
        console.debug(this.meshlist)
        await this.meshlist.forEach(elem => {
            elem.render(this.gl, {ambientLight:[0.2,0.2,0.2], colorLight:[1.0,1.0,1.0]});
        })
    }
}