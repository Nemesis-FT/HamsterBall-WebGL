import {SceneLoader} from "./Engine/Scene.js";
import {Engine} from "./Engine/Engine.js";

const load_event = new Event('loadlevel');
const menu_event = new Event("menu");

const anim_frames = []

let sl, scene, en;

window.addEventListener('loadlevel', async (e) =>{
    function cancelAllAnimationFrames(){
        var id = window.requestAnimationFrame(function(){});
        console.debug(id)
        while(id--){
            window.cancelAnimationFrame(id);
        }
    }
    cancelAllAnimationFrames();
    sl = new SceneLoader();
    scene = await sl.load("Models/"+e.detail.scene)
    en = new Engine("screen");
    en.load_scene(scene).then(r => en.render(0))
})

window.dispatchEvent(new CustomEvent('loadlevel', { detail:{scene: "Menu.json"}}))
