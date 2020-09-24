//  -- 'contains' prototype to search arrays for substring of a given string.
Array.prototype.contains = function(n) {
  for (var i = 0; i < this.length; i++) {
    if (n.includes(this[i])) {
      return true;
    }
    if (i == this.length -1) {
      return false;
    }
  }
}

//  --  Add a 'peek' command for Arrays being used as a LIFO stack.
Array.prototype.peek = function() {
  var g = this.pop();
  this.push(g);
  return g;
}

//  --  Pads out give string with spaces on the right side of the string.
String.prototype.spacePad = function(n) {
	if (this.length >= n) {
		return this;
	}
	var spaces = Array(256).join(' ');
	return((this + spaces).substring(0, n));
}
