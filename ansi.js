//
// ansi.js   -- send ANSI screen codes to stdout
//
// John D. Allen
// May, 2015
//

//----------[ Color Codes ]----------
exports.FG_BLACK = 30;
exports.FG_RED = 31;
exports.FG_GREEN = 32;
exports.FG_YELLOW = 33;
exports.FG_BLUE = 34;
exports.FG_MAGENTA = 35;
exports.FG_CYAN = 36
exports.FG_WHITE = 37

exports.BG_BLACK = 40;
exports.BG_RED = 41;
exports.BG_GREEN = 42;
exports.BG_YELLOW = 43;
exports.BG_BLUE = 44;
exports.BG_MAGENTA = 45;
exports.BG_CYAN = 46
exports.BG_WHITE = 47

//----------[ Terminal Reset ]----------------
exports.resetTerminal = function() {
    process.stdout.write('\u001Bc');
};

//---------[ write to screen ]------------
exports.write = function(n) {
    // really just the same as console.log() 
    process.stdout.write(n);
};

//---------[ Clear screen commands ]-------------
exports.clear = function() {
    process.stdout.write('\u001B[2J\u001B[0;0f');
};

exports.clearEOL = function() {                // clear from cursor to end of line
    process.stdout.write('\u001B[0K');
};

exports.clearSOL = function() {                // clear from cursor to start of line
    process.stdout.write('\u001B[1K');
};

exports.clearLine = function() {            // clear entire line
    process.stdout.write('\u001B[2K');
};

exports.clearEOS = function() {                // clear from cursor to end of screen
    process.stdout.write('\u001B[0J');
};

exports.clearTOS = function() {                // clear from cursor to top of screen
    process.stdout.write('\u001B[1J');
};

//--------[ Text formats ]---------
exports.bold = function() {
    process.stdout.write('\u001B[1m');
};

exports.underline = function() {
    process.stdout.write('\u001B[4m');
};

exports.rev = function() {
    process.stdout.write('\u001B[7m');
};

exports.normal = function() {
    process.stdout.write('\u001B[0m');
};

//----------[ Move Cursor ]-------------
exports.moveUp = function(n) {
    var cmd = '\u001B[' + n + 'A';
    process.stdout.write(cmd);
};

exports.moveDown = function(n) {
    var cmd = '\u001B[' + n + 'B';
    process.stdout.write(cmd);
};

exports.moveRight = function(n) {
    var cmd = '\u001B[' + n + 'C';
    process.stdout.write(cmd);
};

exports.moveLeft = function(n) {
    var cmd = '\u001B[' + n + 'D';
    process.stdout.write(cmd);
};

exports.moveTo = function(x,y) {
    var cmd = '\u001B[' + x +';' + y + 'f';
    process.stdout.write(cmd);
};

//-------------[ Set Text Colors ]---------------
exports.color = function(color) {
    var cmd = '\u001B[' + color + 'm';
    process.stdout.write(cmd);
};



