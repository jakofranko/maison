// From http://www.codingcookies.com/2013/04/05/building-a-roguelike-in-javascript-part-3a/
// Base prototype for representing characters
const Glyph = function(properties) {
	// Instantiate properties to default if they weren't passed
    properties = properties || {};
    this._char = properties['character'] || ' ';
    this._foreground = properties['foreground'] || 'white';
    this._background = properties['background'] || 'black';
};

// Create standard getters for glyphs
Glyph.prototype.getChar = function(){
    return this._char;
};
Glyph.prototype.setChar = function(char) {
    this._char = char;
};
Glyph.prototype.getBackground = function(){
    return this._background;
};
Glyph.prototype.getForeground = function(){
    return this._foreground;
};
Glyph.prototype.getRepresentation = function() {
    return '%c{' + this._foreground + '}%b{' + this._background + '}' + this._char +
        '%c{white}%b{black}';
};
