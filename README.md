# Maison

Maison is a house generator, originally pulled out of a [superhero-themed roguelike I'm building](https://github.com/jakofranko/hero) in order to debug some strange behavior. The inspiration for how to generate the houses comes from lots of sources, but primarily this paper: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.97.4544&rep=rep1&type=pdf

The procedure is essentially two-steps:

1. Generate a graph of the house rooms
2. Render the graph in two- or three-dimensional space by going through each room on the graph, choosing a random direction originating from the last node, and placing tiles or shapes within the constraints given in the renderer parameters.
