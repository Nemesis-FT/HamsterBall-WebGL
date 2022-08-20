import {SceneLoader} from "./Engine/Scene.js";
import {Engine, render} from "./Engine/Engine.js";

const load_event = new Event('loadlevel');
const menu_event = new Event("menu");

window.addEventListener('loadlevel', async (e) =>{
    console.debug(e)
    let sl = new SceneLoader();
    let scene = await sl.load("Models/"+e.detail.scene)
    let en = new Engine("screen");
    en.load_scene(scene).then(r => render(0))
})

window.dispatchEvent(new CustomEvent('loadlevel', { detail:{scene: "level1.json"}}))