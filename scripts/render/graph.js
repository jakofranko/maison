class Graph {
    constructor(maison) {
        this.maison = maison;
        this.graph = maison.generate("foyer");
        this.svg = d3.select("#graph");
        this.w = this.svg.node().getBoundingClientRect().width;
        this.h = this.svg.node().getBoundingClientRect().height;
        this.p = 20;

        // Set up data
        this.root = d3.hierarchy(this.graph);
        this.tree = d3.tree().size([this.w - this.p, this.h - this.p]);

        // Set up visualization
        this.vis = this.svg.append("g")
            .attr("transform", `translate(${this.p / 2},${this.p / 2})`);
        this.lineShapeGenerator = d3.linkHorizontal()
            .x(d => d.x)
            .y(d => d.y);

        this.render();
    }

    render() {
        let data = this.tree(this.root);
        this.vis.selectAll(".line")
            .data(data.links())
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("d", this.lineShapeGenerator);

        this.vis.selectAll(".room")
            .data(data.descendants())
            .enter()
            .append("circle")
            .attr("class", "room")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => Math.sqrt(d.data.width * d.data.height));

        this.vis.selectAll(".room-label")
            .data(data.descendants())
            .enter()
            .append("text")
            .attr("class", "room-label")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("dy", this.p / 4)
            .attr("dx", this.p / 2)
            .text(d => d.data.name);
    }
}
