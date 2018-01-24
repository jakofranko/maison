class Render2D {
    constructor(options = {}) {
        // Display width and height is in characters, so divide the width and height by the fontSize
        this.container = options['container'] || document.getElementById("display");
        this.display = new ROT.Display();

        this.container.appendChild(this.display.getContainer());

        this._resizeTerminal(display);

        this._setUpTiles();

        window.addEventListener('resize', this._resizeTerminal.bind(this, display));
    }

    _setUpTiles() {
        this.display.drawText(10, 10, "%c{#c0ffee}Maison%c{} Terminal");
        this.display.drawText(10, 11, "%c{#ea7aff}(UNDER CONSTRUCTION)");
    }

    _resizeTerminal() {
        let options = this.display.getOptions();
        let parent = this.display.getContainer().parentElement;

        // Set size of display based on parent size
        let size = this.display.computeSize(parent.clientWidth, parent.clientHeight);
        this.display.setOptions({width: size[0], height: size[1]});

        // Set fontsize based on size of display
        let fontSize = this.display.computeFontSize(parent.clientWidth, parent.clientHeight);
        this.display.setOptions({ fontSize });
    }
}
