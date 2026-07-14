
mysql= require('mysql'),
        oConexion = mysql.createConnection({
            host:'localhost',
            database:'marbrayon',
            user:'root',
            password:''
            
        });
        oConexion.connect(function(posibleError){
            if (posibleError) {
                throw posibleError;
                oConexion.end();        
        
    }else{
        console.log('Conexion establecida');
        oConexion.end();
    }
    }
       );
        