var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
home=path.resolve("."); 

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.post('/upload',multipart(), function(req, res) {

    var file = req.files.fileCSV,
    name = file.name,
    type = file.type,
    ruta = home + "/public/archivos/";

    console.log(name,type,ruta);
    fs.rename(file.path, ruta, function(err){
        if(err) res.send("Ocurrio un error al intentar subir la imagen");
    });


    res.send("upladed file");
    
});



module.exports = router;
