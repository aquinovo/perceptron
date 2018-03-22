var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var csv = require('csv'); 
home=path.resolve("."); 
var math = require('mathjs');

// loads the csv module referenced above.

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.post('/upload',multipart(), function(req, res) {

    var file = req.files.fileCSV,
    ruta = home + "/public/archivos/";
    
    var obj = csv(); 
    var matrix=[];
    obj.from.path(file.path).to.array(function (data) {
        var Q = math.subset(data, math.index(math.range( 0,data.length ), math.range( 0,data[0].length-1 ) ) ); 
        console.log(Q);
    });

    


    fs.rename(file.path, ruta, function(err){
        if(err) res.send("Ocurrio un error al intentar subir ");
    });


    res.send("upladed file");
    
});



module.exports = router;
