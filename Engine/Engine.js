import {MeshLoader} from "./MeshLoader.js";

export class Engine{
    constructor (id)
    {
        console.debug("Engine booting up...")
        this.canvas = document.getElementById(id);
        this.gl = this.canvas.getContext("webgl");
        if(!this.gl){
            alert("This browser does not support opengl acceleration.")
        }
        this.meshlist = [];
        this.loader = new MeshLoader(this.meshlist)
    }

    async load_scene(scene){
        console.debug(" Loading scene...")
        scene.objs.forEach(obj => {
            this.loader.load(obj, this.gl)
        })
    }
}