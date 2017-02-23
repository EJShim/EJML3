var E_SocketManager = require('./E_SocketManager.js');
var E_MLManager = require('./E_MLManager.js');

//Interactor
var E_Interactor = require('./E_Interactor.js');


//STL Loader
var STLLoader = require('three-stl-loader')(THREE);
function E_Manager()
{
  var m_socketMgr = new E_SocketManager(this);
  this.mlMgr = null;


  this.renderer = [];

  this.SocketMgr = function()
  {
    return m_socketMgr;
  }


  this.m_bRunTrainning = false;

}

E_Manager.prototype.Initialize = function()
{
  $$("ID_LOG").getNode().style.marginLeft = "50px";
  $$("ID_LOG").getNode().style.marginTop = "15px";


  //Initialzie Render Window
  var renWin = [];
  renWin[0] = $$("ID_VIEW_LEFT");
  renWin[1] = $$("ID_VIEW_RIGHT");

  //Initialize Renderer
  for(var i=0 ; i<2 ; i++){
    this.renderer[i] = new THREE.WebGLRenderer({preserveDrawingBuffer:true, alpha:true});
    this.renderer[i].scene = new THREE.Scene();
    this.renderer[i].camera = new THREE.PerspectiveCamera( 45, renWin[i].$width/renWin[i].$height, 0.1, 10000000000 );

    //Set Init Camera Position
    this.renderer[i].camera.position.z = -20;

    //Add Renderer to The Render Window
    renWin[i].getNode().replaceChild(this.renderer[i].domElement, renWin[i].$view.childNodes[0] );
    this.renderer[i].renderWindow = renWin[i];
    this.renderer[i].setClearColor(0x000015);


    //Set Interactor
    this.renderer[i].interactor = new E_Interactor(this, this.renderer[i]);

  }
  this.renderer[0].pointLight = new THREE.PointLight(0xffffff);
  this.renderer[0].scene.add(this.renderer[0].pointLight);

  this.UpdateWindowSize();
  this.Redraw();



  //Generate Random Object
  this.GenerateRandomObject();
  this.Animate();

}

E_Manager.prototype.OnInitialize = function(network)
{
  this.mlMgr = new E_MLManager(this, network);

  this.Initialize();
}


E_Manager.prototype.UpdateWindowSize = function()
{
  for(var i=0 ; i<2 ; i++){
    this.renderer[i].setSize(this.renderer[i].renderWindow.$width, this.renderer[i].renderWindow.$height);
    this.renderer[i].camera.aspect = this.renderer[i].renderWindow.$width/this.renderer[i].renderWindow.$height;
    this.renderer[i].camera.updateProjectionMatrix();
  }
}

E_Manager.prototype.Redraw = function()
{
  //Sync Camera
  this.SynchronizeCamera();


  //Redraw
  for(var i=0 ; i<2 ; i++){
    this.renderer[i].render(this.renderer[i].scene, this.renderer[i].camera);
  }
}

E_Manager.prototype.SynchronizeCamera = function()
{
  //Synchronize Camera2 according to camera 1
  var cam1 = this.renderer[0].camera;
  var light = this.renderer[0].pointLight;
  var cam2 = this.renderer[1].camera;

  cam2.position.set(cam1.position.x, cam1.position.y, cam1.position.z);
  light.position.set(cam1.position.x, cam1.position.y, cam1.position.z);
  cam2.rotation.set(cam1.rotation.x, cam1.rotation.y, cam1.rotation.z);


}

E_Manager.prototype.Animate = function()
{

  this.renderer[0].control.update();
  requestAnimationFrame( this.Animate.bind(this) );
}



E_Manager.prototype.GenerateRandomObject = function()
{
  var scene = this.renderer[0].scene;
  var camera = this.renderer[0].camera;

  var idx = Math.round(Math.random() * 4);
  cl = idx;
  var geometry, material, mesh, cl;


  if( idx === 0){
    geometry = new THREE.BoxGeometry( Math.random()*5, Math.random()*5, Math.random()*5 );
    material = new THREE.MeshPhongMaterial({shading:THREE.SmoothShading, shininess:10, specular:0xaaaaaa, side:THREE.DoubleSide});
    mesh = new THREE.Mesh( geometry, material );
  }else if(idx === 1){

    geometry = new THREE.ConeGeometry( Math.random()*5+1, Math.random()*20, 32 );
    material = new THREE.MeshPhongMaterial({shading:THREE.SmoothShading, shininess:10, specular:0xaaaaaa, side:THREE.DoubleSide});
    mesh = new THREE.Mesh( geometry, material );
  }else if(idx === 2){

    var rad = Math.random()*5+1
    var height = Math.random()*10+1;
    geometry = new THREE.CylinderGeometry( rad, rad, height, 32 );
    material = new THREE.MeshPhongMaterial({shading:THREE.SmoothShading, shininess:10, specular:0xaaaaaa, side:THREE.DoubleSide});
    mesh = new THREE.Mesh( geometry, material );
  }else if(idx === 3){

    geometry = new THREE.TorusKnotGeometry( Math.random()*10, Math.random()*3, 100, 16 );
    material = new THREE.MeshPhongMaterial({shading:THREE.SmoothShading, shininess:10, specular:0xaaaaaa, side:THREE.DoubleSide});
    mesh = new THREE.Mesh( geometry, material );
  }else{

    geometry = new THREE.SphereGeometry(Math.random()*5, 32, 32);
    material = new THREE.MeshPhongMaterial({shading:THREE.SmoothShading, shininess:10, specular:0xaaaaaa, side:THREE.DoubleSide});
    mesh = new THREE.Mesh( geometry, material );
  }


  //Random Color, Not Important
  mesh.geometry.mergeVertices();
  mesh.class = cl;

  //Random Rotation
  mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.random()*Math.PI*2 ) );
  mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationY( Math.random()*Math.PI*2 ) );
  mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( Math.random()*Math.PI*2 ) );
  material.color = new THREE.Color(Math.random()+0.5, Math.random()+0.2, Math.random());

  //Add to Scene
  scene.add( mesh );
  camera.lookAt(mesh.position);

  //Redraw Scene
  this.GenerateVoxelizedObject(mesh);
  this.Redraw();
}

E_Manager.prototype.GenerateVoxelizedObject = function(mesh)
{
  //Make 20x20x20 voxel volume data
  var segments = 20;

  //right scene
  var orScene = this.renderer[0].scene;
  var scene = this.renderer[1].scene;

  //Compute Bounding Sphere
  mesh.geometry.computeBoundingSphere();
  var rad = mesh.geometry.boundingSphere.radius;
  var center = mesh.geometry.boundingSphere.center;

  this.renderer[0].control.target = center;
  var voxelSize = (rad * 2) / segments;

  /// Visualize Bounding Hexadron
  var geometry = new THREE.SphereGeometry( rad, 32, 32 );
  geometry.applyMatrix( new THREE.Matrix4().makeTranslation(center.x, center.y, center.z) );
  geometry.computeBoundingBox();
  var material = new THREE.LineBasicMaterial( {color: 0x00ff00} );
  var sphere = new THREE.Mesh( geometry, material );
  var box = new THREE.BoxHelper(sphere, 0xffff00);


  // Initialize Voxel Space.
  var voxelSpace = [];
  for(var i=0 ; i<segments ; i++){
    voxelSpace.push([]);
    for(var j=0 ; j<segments ; j++){
      voxelSpace[i].push([]);
      for(var k=0 ; k<segments ; k++){
        voxelSpace[i][j].push(0);
      }
    }
  }



  var min = geometry.boundingBox.min;


  ///Find Where Voxel Should Be Placed = Using Raycaster
  var rayDir = new THREE.Vector3(0, 0, 1);
  for(var i=0 ; i<segments ; i++){
    for(var j=0 ; j<segments ; j++){
      var origin = this.VoxelIdxToPosition(min, voxelSize, {x:i, y:j, z:0});
      var rayCaster = new THREE.Raycaster(origin,rayDir, -rad, rad*2);

      var intersects = rayCaster.intersectObjects( orScene.children );

      var length = intersects.length
      if(length > 0){

        if(length%2 === 1){
          for(var k=0 ; k<length ; k++){
            var pos = intersects[k].point;
            var idx = this.PositionToVoxelIdx(min, voxelSize, pos);
            voxelSpace[idx.x][idx.y][idx.z] = 1;
          }
        }else{
          for(var k=0 ; k<length ; k+=2){
            var startPos = intersects[k].point;
            var endPos = intersects[k+1].point;

            var len = endPos.clone().sub(startPos).length();
            var iter = Math.abs(len/voxelSize);

            for(var m=0 ; m<iter ; m++){
              var pos = startPos.add( rayDir.clone().multiplyScalar(voxelSize) )
              var idx = this.PositionToVoxelIdx(min, voxelSize, pos);
              voxelSpace[idx.x][idx.y][idx.z] = 1;
            }
          }
        }
      }
    }
  }

  rayDir = new THREE.Vector3(0, 1, 0);
  for(var i=0 ; i<segments ; i++){
    for(var j=0 ; j<segments ; j++){
      var origin = this.VoxelIdxToPosition(min, voxelSize, {x:i, y:0, z:j});
      var rayCaster = new THREE.Raycaster(origin,rayDir, 0, rad*2+1);
      origin.add( rayDir.clone().multiplyScalar(-1) );

      var intersects = rayCaster.intersectObjects(orScene.children );

      var length = intersects.length
      if(length > 0){

        if(length%2 === 1){
          for(var k=0 ; k<length ; k++){
            var pos = intersects[k].point;
            var idx = this.PositionToVoxelIdx(min, voxelSize, pos);
            voxelSpace[idx.x][idx.y][idx.z] = 1;
          }
        }else{
          for(var k=0 ; k<length ; k+=2){
            var startPos = intersects[k].point;
            var endPos = intersects[k+1].point;

            var len = endPos.clone().sub(startPos).length();
            var iter = Math.abs(len/voxelSize);

            for(var m=0 ; m<iter ; m++){
              var pos = startPos.add( rayDir.clone().multiplyScalar(voxelSize) )
              var idx = this.PositionToVoxelIdx(min, voxelSize, pos);
              voxelSpace[idx.x][idx.y-1][idx.z] = 1;
            }
          }
        }
      }
    }
  }



  //Visualize voxelSpace
  this.VisualizeVoxels(box, voxelSpace, segments, voxelSize, min, scene);


  this.mlMgr.PutVolume({data:voxelSpace, class:mesh.class});

}

E_Manager.prototype.VisualizeVoxels = function(box, voxelSpace, segments, voxelSize, min, scene)
{
  if(this.m_bRunTrainning) {return};

  ////Visualize Voxels
  for(var i=0 ; i<segments ; i++){
    for(var j=0 ; j<segments ; j++){
      for(var k=0 ; k<segments ; k++){

        if(voxelSpace[i][j][k] == 1){
          var minGeometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
          var minMaterial = new THREE.MeshBasicMaterial({transparent:true, color:0x00aa00, opacity:0.3});
          var voxel = new THREE.Mesh(minGeometry, minMaterial);

          var pos = this.VoxelIdxToPosition(min, voxelSize, {x:i, y:j, z:k});
          voxel.position.set( pos.x, pos.y, pos.z );
          scene.add(voxel);
        }
      }
    }
  }

  scene.add( box );
}

E_Manager.prototype.PositionToVoxelIdx = function(min, voxelSize, position)
{
  var idx = {x:null, y:null, z:null};

  idx.x = Math.abs(Math.round((position.x-min.x)/voxelSize - 0.5));
  idx.y = Math.abs(Math.round((position.y-min.y)/voxelSize - 0.5));
  idx.z = Math.abs(Math.round((position.z-min.z)/voxelSize - 0.5));

  return idx;
}

E_Manager.prototype.VoxelIdxToPosition = function(min, voxelSize, idx)
{
  var pos = new THREE.Vector3(min.x+voxelSize*(idx.x+0.5), min.y+voxelSize*(idx.y+0.5), min.z+voxelSize*(idx.z+0.5));

  return pos;
}

E_Manager.prototype.Frand = function(min, max)
{
  var range = max - min;
  var value = Math.random();

  value *= range;
  value += min;

  return value;
}

E_Manager.prototype.ClearScene = function( generateNext )
{
  if(generateNext === undefined) generateNext = true;

  var scene0 = this.renderer[0].scene;
  var length0 = scene0.children.length;

  for(var j=length0-1 ; j>=0; j--){
    if(scene0.children[j] instanceof THREE.Mesh)
    {
      scene0.remove( scene0.children[j] );
    }
  }

  var scene = this.renderer[1].scene;
  var length = scene.children.length;
  for(var i=0 ; i<length ; i++){
    scene.remove(scene.children[0]);
  }

  //this.Redraw();
  if(generateNext){
    this.GenerateRandomObject();
  }
}

E_Manager.prototype.SetLog = function(text)
{
  $$("ID_LOG").getNode().innerHTML = text
}

E_Manager.prototype.AppendLog = function(text)
{
  $$("ID_LOG").getNode().innerHTML += text;
}

E_Manager.prototype.OnRunTrainning = function(value)
{
  if(value === 1){
    this.m_bRunTrainning = true;
    this.ClearScene();
  }else{
    this.m_bRunTrainning = false;
  }
}

E_Manager.prototype.ImportMesh = function(path)
{
  var that = this;
  var scene = this.renderer[0].scene;

  var loader = new THREE.OBJLoader();
  loader.load( path, function ( object ) {
    that.ClearScene(false);

    var mesh = object.children[0];
    mesh.material = new THREE.MeshPhongMaterial({shading:THREE.SmoothShading, shininess:10, specular:0xaaaaaa, side:THREE.DoubleSide});
    mesh.material.color = new THREE.Color(Math.random(), Math.random(), Math.random());

    scene.add( mesh );
    mesh.class = null;
    that.GenerateVoxelizedObject(mesh);
    that.Redraw();
  } );
}

E_Manager.prototype.ImportSTL = function(path)
{
  var that = this;
  var scene = this.renderer[0].scene;


  var loader = new STLLoader();

  loader.load( path, function(geometry){
    //clear Scene
    that.ClearScene(false);


    var material = new THREE.MeshPhongMaterial({shading:THREE.SmoothShading, shininess:10, specular:0xaaaaaa, side:THREE.DoubleSide});
    material.color = new THREE.Color(Math.random(), Math.random(), Math.random());
    var mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);
    mesh.class = null;
    that.GenerateVoxelizedObject(mesh);
    that.Redraw();
  } );
}

module.exports = E_Manager;
