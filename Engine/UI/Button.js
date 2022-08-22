export class Button {

    constructor(text, geometry, canvas, ctx) {
        this.geometry = geometry;
        this.text = text;
        this.canvas = canvas;
        this.ctx = ctx;
    }

    enable() {
        this.canvas.addEventListener("click", this.handle)
        this.canvas.addEventListener("touchstart", this.handle)
    }

    disable() {
        this.canvas.removeEventListener("click", this.handle)
        this.canvas.removeEventListener("touchstart", this.handle)
    }

    draw() {
        this.ctx.fillStyle = "#000000";
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillRect(this.geometry.coordinates.x - this.geometry.width / 2, this.geometry.coordinates.y - this.geometry.height / 2, this.geometry.width, this.geometry.height)
        this.ctx.globalAlpha = 1.0;
        this.ctx.font = "Style/Fonts/w-95-sans-serif";
        this.ctx.textAlign = "center"
        this.ctx.fillText(this.text, this.geometry.coordinates.x, this.geometry.coordinates.y);
    }

    normalize(e) {
        let element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
        if (element.offsetParent !== undefined) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }
        mx = e.pageX - offsetX;
        my = e.pageY - offsetY;
        console.debug(this.geometry.coordinates, {x: mx, y: my})
        return {x: mx, y: my};
    }

    collision(coords){
        if (coords.x > this.geometry.coordinates.x - this.geometry.width / 2 &&
            coords.x < this.geometry.coordinates.x + this.geometry.width / 2 &&
            coords.y > this.geometry.coordinates.y - this.geometry.height / 2 &&
            coords.y < this.geometry.coordinates.y + this.geometry.height / 2) {
            return true
        }
        return false
    }

    handle = e => {
        if(this.collision(this.normalize(e))) console.debug("Hit!")
    }


}