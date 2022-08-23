import {Engine} from "./Engine.js";

export class Scene {
    constructor(name, objs, phys) {
        this.name = name;
        this.objs = objs;
        this.die = false;
        this.phys = phys === "true" || phys
        console.debug(objs)

    }


}

export class SceneLoader {
    async load(path) {
        let scene = null;
        await fetch(path)
            .then(response => response.json())
            .then(s => {
                console.debug(s)
                scene = new Scene(s.name, s.objs, s.phys)
            })
        console.debug(scene)
        return scene
    }
}