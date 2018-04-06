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
    
    fs.rename(file.path, ruta, function(err){
        if(err) res.send("Ocurrio un error al intentar subir ");
    });

    
    rosenblatt(obj,file,0.2);
    res.redirect("/");
    
});

function rosenblatt(obj,file,porcP){
      obj.from.path(file.path).to.array(function (data) {
        
        var datos=crossovalidation(data,porcP);
        var numeroDatos=1/porcP;
        var pesos=[]; 
        
        //Fase de entrenemiento 
        for (var h = 0; h < numeroDatos; h++) {
            var datoEntrenamiento=datos[0][h];
            var Q = math.subset(datoEntrenamiento, math.index(math.range( 0,datoEntrenamiento.length ), math.range( 0,datoEntrenamiento[0].length-1 ) ) ); 
            var X=math.transpose(math.concat(math.ones(datoEntrenamiento.length,1),Q));
            var nEj= math.size(Q)[0];
            var F= math.size(Q)[1];
            
            //Número de características (m)
            var m=datoEntrenamiento[0].length - 1;

            // Vector de salida
            // Etiquetas de cada ejemplo de entrada
            var Y= math.subset(datoEntrenamiento, math.index(math.range( 0,datoEntrenamiento.length ), datoEntrenamiento[0].length-1 ) ); 
            
            //Obtener el numero de clases 
            var clases = math.transpose(Y)[0].filter(function(elem, index, self) {
                return index == self.indexOf(elem);
            }); 
            
            //obtener Etiquetas de cada clase
            var Yi=obtenerYi( math.transpose(Y)[0],clases );

            
            // Número de iteraciones
            var numIt = 50;

            // Vector de pesos
            var w= math.zeros(clases.length,numIt+1, m+1);
            //w1= w.subset( math.index(0,math.range( 0,numIt+1 ),math.range( 0,m+1 )  ) );
            for (var i = 0; i < w.size()[0]; i++) {
                w.subset( math.index(i,0,math.range(0,m+1) ), math.add(math.random([m+1]),-0.5) ) ;
            }
            
            // Coeficiente de aprendizaje  
            var n = 0.5;
              
            for (var it = 0; it < numIt; it++) {
                var yi= math.zeros(clases.length,nEj).toArray();
                
                
                for (var i = 0; i < clases.length; i++) {
                    for (var j = 0; j < nEj; j++) {
                         var wtemp = math.subset(w, math.index(i,it, math.range( 0,m+1 )  ) ).toArray()[0][0] ;
                         var xtemp = math.subset(X,math.index(math.range(0,m+1), j)).toArray() ;
                         yi[i][j]=signo(math.multiply( wtemp,xtemp )[0]) ;
                    }
                }

                var aciertos=[]; 
                for (var i = 0; i < clases.length; i++) {
                    aciertos[i]= math.filter(math.compare(yi[i],Yi[clases[i]]), isZero).length ; 
                }

                for (var i = 0; i < w.size()[0]; i++) {
                    w.subset( math.index(i,it+1,math.range(0,m+1) ),  w.subset( math.index(i,it,math.range(0,m+1) ) ) ) ;
                }
                
                for (var i = 0; i < clases.length; i++) {
                     for (var j = 0; j < nEj; j++) {
                         var valuetemp1=math.subset(w, math.index(i,it+1, math.range( 0,m+1 )  ) ).toArray()[0][0] ;
                         var valuetemp2=math.multiply(math.transpose(math.subset(X,math.index(math.range(0,m+1), j)).toArray()),(Yi[clases[i]][j]-yi[i][j])*n );  
                         w.subset( math.index(i,it+1, math.range( 0,m+1 )  ),math.add(valuetemp1,valuetemp2[0]) );      
                     }
                 }   
            }

            console.log("Teminado el entrenamiento");
            pesos[h]=math.subset(w, math.index(math.range( 0,clases.length ) ,numIt, math.range( 0,m+1 ))).toArray() ; 
        }

        //Fase Prueba
        /*for (var i = 0; i < pesos.length; i++) {
            console.log(pesos[i]);
        }*/
        var matConf=[];
        for (var i = 0; i < clases.length; i++) {
            matConf[i]=[];
            for (var j = 0; j < clases.length; j++) {
                matConf[i][j]=0;
            }
        }

        for (var h = 0; h < numeroDatos; h++) {
            var datoPrueb=datos[1][h];

            var Q = math.subset(datoPrueb, math.index(math.range( 0,datoPrueb.length ), math.range( 0,datoPrueb[0].length-1 ) ) ); 
            var X=math.transpose(math.concat(math.ones(datoPrueb.length,1),Q));
            var nEj= math.size(Q)[0];

            // Etiquetas de cada ejemplo de prueba
            var Y= math.subset(datoPrueb, math.index(math.range( 0,datoPrueb.length ), datoPrueb[0].length-1 ) );  
            
            //obtener Etiquetas de cada clase
            var Yi=obtenerYi( math.transpose(Y)[0],clases );
            
            var yi= math.zeros(clases.length,nEj).toArray();   

            for (var i = 0; i < clases.length; i++) {
                for (var j = 0; j < nEj; j++) {
                     var xtemp = math.subset(X,math.index(math.range(0,m+1), j)).toArray() ;
                     var wtemp = pesos[h][i][0];
                     yi[i][j]=signo(math.multiply( wtemp,xtemp )[0]) ;
                }
            }
            

            for (var j = 0; j < nEj; j++) {
                for (var i = 0; i < clases.length; i++) {
                     if(yi[i][j] ==1)
                        matConf[datoPrueb[j][datoPrueb[0].length-1]-1][i]+=1;
                } 
            }

            for (var i = 0; i < clases.length; i++) {
                aciertos[i]= math.filter(math.compare(yi[i],Yi[clases[i]]), isZero).length ;  
            }
            console.log(aciertos);
            console.log(matConf);
            
        }
      
    });

}
function crossovalidation(data,numelem){
    var Y= math.subset(data, math.index(math.range( 0,data.length ), data[0].length-1 ) ); 
    var clases = math.transpose(Y)[0].filter(function(elem, index, self) {
        return index == self.indexOf(elem);
    }); 
    var entrenamiento=[];
    for (var i = 0; i < clases.length; i++) {
        entrenamiento[ i ] = data.filter(function(elem, index, self) {
            if(elem[elem.length-1]==clases[i])
                return elem;
        }); 
    }

    var numeroDatos=1/numelem;
    var matrizEntrenamiento=[];
    var matrizPrueba=[];
    for (var h = 0; h < numeroDatos; h++) {
        var temp1=[], temp2=[],cont1=0,cont2=0;
        var posclases=[];
        var sum=0; 
        for (var i = 0; i < clases.length; i++) {
            posclases[i]=Array.from({length: entrenamiento[i].length}, (v, k) => k);
            posclases[i]=math.add(posclases[i],sum);
            posclases[i] = posclases[i].sort(function() {return Math.random() - 0.5});
        }
        
        for (var i = 0; i < clases.length; i++) {
            for (var j = 0; j < posclases[i].length; j++) {
                if (j <  posclases[i].length *(1-numelem)) {
                    temp1[cont1++]=entrenamiento[i][posclases[i][j]];
                }else{
                    temp2[cont2++]=entrenamiento[i][posclases[i][j]];   
                }
            }
        }
        matrizEntrenamiento[h]=temp1;
        matrizPrueba[h]=temp2;
    }

    return [matrizEntrenamiento,matrizPrueba];
}


function isPositive (item,pos) {
  return this.indexOf(item)== pos;
}
function isZero (x) {
  return x == 0;
}

function obtenerYi(entrada,clases){
    var yi=[]; 
    for (var i = 0; i < clases.length; i++) {
        yi[clases[i]]=math.add(math.multiply(entrada,0),-1);
    }
    for (var j = 0; j < entrada.length; j++) {
        yi[entrada[j]][j]=1;
    }
    return yi;
}

function signo(x){
    if( x > 0)
        return 1;
    else
        return -1;
}

module.exports = router;
