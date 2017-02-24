var convnetjs = require('convnetjs');


//Machine Learning Manager
function E_MLManager(Mgr, network)
{
  this.Mgr = Mgr;

  //Network
  this.network = new convnetjs.Net();



  ///Initialize
  this.Initialize(network);
}

E_MLManager.prototype.Initialize = function(network)
{

  //input 20x20x20, output 5 classes
  var layer_defs = [];
  layer_defs.push({type:'input', out_sx:20, out_sy:20, out_depth:20});
  layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
  layer_defs.push({type:'pool', sx:2, stride:2});
  layer_defs.push({type:'conv', sx:5, filters:20, stride:1, pad:2, activation:'relu'});
  layer_defs.push({type:'pool', sx:2, stride:2});
  layer_defs.push({type:'conv', sx:5, filters:20, stride:1, pad:2, activation:'relu'});
  layer_defs.push({type:'pool', sx:2, stride:2});
  layer_defs.push({type:'softmax', num_classes:5});

  this.network.makeLayers(layer_defs);
  // this.network.fromJSON( JSON.parse(network) );

}

E_MLManager.prototype.PutVolume = function( volume )
{
  var className = ["Box", "Cone", "Cylinder", "TorusKnot", "Sphere"];
  var length = volume.data.length;
  var convVol = new convnetjs.Vol(length, length, length, 0.0);

  for(var i=0 ; i<length; i++){
    for(var j=0 ; j<length; j++){
      for(var k=0 ; k<length; k++){
        if( volume.data[i][j][k] === 1 ){
          convVol.set(i, j, k, volume.data[i][j][k]);
        }
      }
    }
  }

  if(volume.class === null){
    this.Mgr.SetLog("<b style='color:red'> Unknown Input </b><br>");
  }else{
    this.Mgr.SetLog("<b style='color:red'>Input :" + className[volume.class] + "</b><br>");
  }

  //Calculate Possibility
  var probability = this.network.forward(convVol);


  //Get The Maximum
  var max = 0;
  var maxIdx = 0;

  for(var i=0 ; i<5 ; i++){
    if(probability.w[i] > max){
      max = probability.w[i];
      maxIdx = i;
    }
  }

  //Update Graph with loss function
  this.Mgr.UpdateGraph( probability.w[volume.class] );


  //Show Probability
  for(var i=0 ; i<5 ; i++){
    var prob = probability.w[i] * 100
    this.Mgr.AppendLog("<br>");

    if(i === maxIdx){
        this.Mgr.AppendLog("<b>" + className[i] + " : " + prob.toFixed(4) + " %</b>");
    }else{
      this.Mgr.AppendLog(className[i] + " : " + prob.toFixed(4) + " %");
    }
  }

  //Max Class Name
  this.Mgr.AppendLog("<br><br>");
  this.Mgr.AppendLog("<b style='color:blue'> Predicted : " + className[maxIdx] + "</b>")



  //Train Data
  if(volume.class !== null){
    var trainer = new convnetjs.Trainer(this.network, {learning_rate:0.02, l2_decay:0.001});
    trainer.train(convVol, volume.class);

    ///Save Network
    var jsonNetwork = JSON.stringify( this.network.toJSON() );
    this.Mgr.SocketMgr().EmitData("SAVE_NETWORK", jsonNetwork);
  }
}

module.exports = E_MLManager;
