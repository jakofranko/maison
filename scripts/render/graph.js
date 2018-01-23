const w = window.innerWidth;
const h = window.innerHeight;
const p = 20;

const svg = d3.select("svg")
    .attr("width", w)
    .attr("height", h);

const vis = svg.append("g")
    .attr("transform", `translate(${p / 2},${p / 2})`);

// Data
const maison = new Maison();
const graph = maison.generate("foyer");
const root = d3.hierarchy(graph);
const tree = d3.tree().size([w - p, h - p]);

// Viz
const lineShapeGenerator = d3.linkHorizontal()
    .x(d => d.x)
    .y(d => d.y);

vis.selectAll(".line")
    .data(tree(root).links())
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("d", lineShapeGenerator);

vis.selectAll(".room")
    .data(tree(root).descendants())
    .enter()
    .append("circle")
    .attr("class", "room")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => Math.sqrt(d.data.width * d.data.height));

vis.selectAll(".room-label")
    .data(tree(root).descendants())
    .enter()
    .append("text")
    .attr("class", "room-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("dy", p / 2)
    .attr("dx", p / 2)
    .text(d => d.data.name);
