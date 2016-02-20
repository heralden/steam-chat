module.exports = keys;

function keys(interface) {
  this.interface = interface;
}

keys.prototype.listen = function() {
  this.interface.screen.key(['C-c'], function(ch, key) {
    return process.exit(0);
  }.bind(this));

  this.interface.inputBar.key(['pageup', 'M-v'], function(ch, key) {
    this.interface.interpretCommand('scrollb');
  }.bind(this));
  this.interface.inputBar.key(['pagedown', 'C-v'], function(ch, key) {
    this.interface.interpretCommand('scrollf');
  }.bind(this));
  this.interface.inputBar.key(['M-w'], function(ch, key) {
    this.interface.interpretCommand('part');
  }.bind(this))
  this.interface.inputBar.key(['M-g'], function(ch, key) {
    this.interface.interpretCommand('games');
  }.bind(this))

  this.interface.inputBar.key(['M-1'], function(ch, key) {
    this.interface.interpretCommand('w 1');
  }.bind(this));
  this.interface.inputBar.key(['M-2'], function(ch, key) {
    this.interface.interpretCommand('w 2');
  }.bind(this));
  this.interface.inputBar.key(['M-3'], function(ch, key) {
    this.interface.interpretCommand('w 3');
  }.bind(this));
  this.interface.inputBar.key(['M-4'], function(ch, key) {
    this.interface.interpretCommand('w 4');
  }.bind(this));
  this.interface.inputBar.key(['M-5'], function(ch, key) {
    this.interface.interpretCommand('w 5');
  }.bind(this));
  this.interface.inputBar.key(['M-6'], function(ch, key) {
    this.interface.interpretCommand('w 6');
  }.bind(this));
  this.interface.inputBar.key(['M-7'], function(ch, key) {
    this.interface.interpretCommand('w 7');
  }.bind(this));
  this.interface.inputBar.key(['M-8'], function(ch, key) {
    this.interface.interpretCommand('w 8');
  }.bind(this));
  this.interface.inputBar.key(['M-9'], function(ch, key) {
    this.interface.interpretCommand('w 9');
  }.bind(this));

  this.interface.inputBar.on('keypress', function() {
    this.interface.idle();
  }.bind(this));

  // Text editing 

  this.interface.inputBar.key(['C-u'], function(ch, key) {
    this.interface.session.yankBuffer = this.interface.inputBar.getValue();
    this.interface.inputBar.clearValue();
    this.interface.screen.render();
  }.bind(this));

  this.interface.inputBar.key(['C-y'], function(ch, key) {
    this.interface.inputBar.setValue(this.interface.inputBar.getValue() + this.interface.session.yankBuffer);
    this.interface.screen.render();
  }.bind(this));

  this.interface.inputBar.key(['C-w'], function(ch, key) {
    var text = this.interface.inputBar.getValue();
    var textTrim = text.replace(/\s+$/gm,''); // remove trailing whitespace
    var yank = text.substring(textTrim.lastIndexOf(' ') + 1);
    text = text.substring(0, textTrim.lastIndexOf(' ') + 1);
    this.interface.session.yankBuffer = yank;
    this.interface.inputBar.setValue(text);
    this.interface.screen.render();
  }.bind(this));

  /* FIX: Moves cursor but not input.
  this.interface.inputBar.key(['C-b'], function(ch, key) {
    this.interface.program.back();
    this.interface.screen.render();
  }.bind(this));
  */
};
