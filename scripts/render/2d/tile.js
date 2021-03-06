// From http://www.codingcookies.com/2013/04/05/building-a-roguelike-in-javascript-part-3a/
// Base prototype for representing 'tiles', which are environment characters that contain glyphs, and other information such as whether or not the tile is walkable or not.
const Tile = function(properties) {
	properties = properties || {};
    // Call the Glyph constructor with our properties
    Glyph.call(this, properties);
    // Set up the properties. We use false by default.
    this._name = properties['name'] || false;
    this._walkable = properties['walkable'] || false;
    this._diggable = properties['diggable'] || false;
    this._blocksLight = properties['blocksLight'] || false;
    this._outerWall = properties['outerWall'] || false;
    this._innerWall = properties['innerWall'] || false;
    this._description = properties['description'] || '';
};
// Make tiles inherit all the functionality from glyphs
Tile.extend(Glyph);

// Standard getters
Tile.prototype.isWalkable = function() {
    return this._walkable;
};
Tile.prototype.isDiggable = function() {
    return this._diggable;
};
Tile.prototype.isBlockingLight = function() {
    return this._blocksLight;
};
Tile.prototype.isOuterWall = function() {
    return this._outerWall;
};
Tile.prototype.setOuterWall = function(outerWall) {
    this._outerWall = outerWall;
};
Tile.prototype.isInnerWall = function() {
    return this._innerWall;
};
Tile.prototype.setInnerWall = function(innerWall) {
    this._innerWall = innerWall;
};
Tile.prototype.getDescription = function() {
    return this._description;
};
Tile.prototype.getName = function() {
    return this._name;
};
