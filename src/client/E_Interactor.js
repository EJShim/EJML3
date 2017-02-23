var TrackballControls = require('three-trackballcontrols');

function E_Interactor(Mgr, renderer)
{
  this.Mgr = Mgr;
  this.renderer = renderer

  this.m_bMouseDown = false;

  this.Initialize();
}

E_Interactor.prototype.Initialize = function()
{
  //Add Event Listner
  var canvas = this.renderer.domElement;

  canvas.addEventListener('mousewheel', this.OnMouseWheel.bind(this), false);
  canvas.addEventListener('mousedown', this.OnMouseDown.bind(this), false );
  canvas.addEventListener('mouseup', this.OnMouseUp.bind(this), false );
  canvas.addEventListener('mousemove', this.OnMouseMove.bind(this), false );


  canvas.addEventListener( 'touchstart', this.OnMouseDown.bind(this), false );
  canvas.addEventListener( 'touchend', this.OnMouseUp.bind(this), false );
  canvas.addEventListener( 'touchmove', this.OnMouseMove.bind(this), false );


  //Initialize control
  this.renderer.control = new TrackballControls(this.renderer.camera, this.renderer.domElement );
  this.renderer.control.rotateSpeed = 4.0;
  this.renderer.control.zoomSpeed = 1.2;
  this.renderer.control.panSpeed = 0.8;
  this.renderer.control.noZoom = false;
  this.renderer.control.noPan = false;
  this.renderer.control.staticMoving = true;
  this.renderer.control.dynamicDampingFactor = 0.3;
  this.renderer.control.keys = [ 65, 83, 68 ];
  this.renderer.control.addEventListener( 'change', this.Mgr.Redraw.bind(this.Mgr) );
}

E_Interactor.prototype.OnMouseDown = function()
{
  this.m_bMouseDown = true;
}

E_Interactor.prototype.OnMouseUp = function()
{
  this.m_bMouseDown = false;
}


E_Interactor.prototype.OnMouseMove = function()
{
  
}

E_Interactor.prototype.OnMouseWheel = function()
{
  //this.Mgr.UploadScene();
}

module.exports = E_Interactor;
