export class Scene {
    constructor(name, objs) {
        this.name = name;
        this.objs = objs;
    }
}

export class SceneLoader {
    async load(path) {
        let scene = null;
        await fetch(path)
            .then(response => response.json())
            .then(s => {
                console.debug(s)
                scene = new Scene(s.name, s.objs)
            })
        return scene
    }
}