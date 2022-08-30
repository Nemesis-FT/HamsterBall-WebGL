export class UI {
    constructor(canvasName){
        this.canvas = document.getElementById(canvasName)
        this.ctx = this.canvas.getContext("2d");
    }

    draw(font, fill, coords, string){
        this.ctx.font = font;
        this.ctx.fillStyle = fill;
        this.ctx.textAlign = "center"
        this.ctx.fillText(string, coords.x, coords.y);
    }

    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
