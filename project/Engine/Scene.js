import {Engine} from "./Engine.js";

export class Scene {
    constructor(name, objs, phys) {
        // Represents json file.
        this.name = name;
        this.objs = objs;
        this.die = false;
        this.phys = phys === "true" || phys

    }


}

export class SceneLoader {
    // Async SceneLoader that returns a Scene object via file loading from disk.
    async load(path) {
        let scene = null;
        await fetch(path)
            .then(response => response.json())
            .then(s => {
                scene = new Scene(s.name, s.objs, s.phys)
            })
        return scene
    }
}