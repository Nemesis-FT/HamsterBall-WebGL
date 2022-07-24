import {SceneLoader} from "./Engine/Scene.js";
import {Engine, render} from "./Engine/Engine.js";

let sl = new SceneLoader();
let scene = await sl.load("./scene.json")
let en = new Engine("screen");
en.load_scene(scene).then(r => render())
