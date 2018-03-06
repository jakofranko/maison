Math.getRandomInRange = function(min, max) {
    return Math.floor(ROT.RNG.getUniform() * (max - min + 1)) + min;
};

const consoleLogGrid = function(grid, field, items, z, hlX, hlY) {
    var string = "";
    for (var y = 0; y < grid[0].length; y++) {
        for (var x = 0; x < grid.length; x++) {
            if(x && y && x === hlX && y === hlY) // Begin highlight
                string += "%c";
            if(items && z !== undefined && items[x + "," + y + "," + z])
                string += items[x + "," + y + "," + z][0]._char;
            else if(!grid[x] || !grid[x][y])
                string += " ";
            else if(field)
                string += String(grid[x][y][field]);
            else
                string += String(grid[x][y]);

            if(x && y && x === hlX && y === hlY) // close highlight
                string += "%c";
        }
        string += "\n";
    }

    console.log(string, "color: red; background: black", "");
};
