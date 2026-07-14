const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const bodyParser = require('body-parser');
const { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = require('transbank-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;



const MySQLStore = require('express-mysql-session')(session);
const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));

const app = express();
const port = 3000;

const apiKey = defaultClient.authentications['api-key'];
require('dotenv').config();
apiKey.apiKey = process.env.SENDINBLUE_API_KEY || '';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();


const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pollos2'
};

const oConexion = mysql.createConnection(dbConfig);

oConexion.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

const sessionStore = new MySQLStore({}, oConexion.promise());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: 'tu_secreto',
    resave: false,
    saveUninitialized: true,
    store: sessionStore
}));

let correo1;

// EMAIL PARA ENVIAR EL CORREO
app.post('/enviarcorreo', (req, res) => {
    const email = req.body.tonto;
    correo1=email;
  
  //limita a 1 busqueda 
    const query = 'SELECT 1 FROM usuarios WHERE email_usuario = ? LIMIT 1';
    
    oConexion.query(query, [email], (error, results) => {
      if (error) {
        console.error('Error en la query:', error);
        return res.status(500).send('Error del server');
      }
      
      if (results.length > 0) {
        // Configuración del correo
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: email }];
        sendSmtpEmail.sender = { email: 'nonemonster1234lol@gmail.com', name: 'marbrayon' };
        sendSmtpEmail.subject = 'Recuperación de cuenta';
        sendSmtpEmail.textContent = 'Este es el contenido del correo de recuperación.';
        sendSmtpEmail.htmlContent = '<html><body><p>solicitud de recuperacion de contraseña</p><a href="http://localhost:3000/nuevapass">recuperar</a></body></html>';
  
        // Envío del correo
        apiInstance.sendTransacEmail(sendSmtpEmail).then((data) => {
            res.redirect('/inicio');
         
        }).catch((error) => {
          console.error(error);
          res.send('Correo no existente <a href="http://localhost:3000/">volver</a>');
        });
      } else {
        res.send('Correo invalido vuelva a ingresar <a href="http://localhost:3000/recuperacion">volver</a>');
      }
    });
  });


// CAMBIAR CONTRASEÑA
app.post('/cambiarpass', (req, res) => {
    const pass_usuario = req.body.campo2;

    const sql = "UPDATE usuarios SET pass_usuario = ? WHERE email_usuario = ?";
    oConexion.query(sql, [pass_usuario, correo1], (error, results) => {
        if (error) {
            console.error('Error en la query:', error);
            return res.status(500).send('Error del server');
        }
        console.log("Usuario actualizado correctamente");
        res.redirect('/inicio');
    });
});



// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/index');
        }
        res.clearCookie('connect.sid'); 
        res.redirect('/landingpage');
    });
});

function authMiddleware(req, res, next) {
    if (req.session.userId) {
        // Obtener los datos del usuario
        const sql = "SELECT nombre_usuario, email_usuario FROM usuarios WHERE id_usuario = ?";
        oConexion.query(sql, [req.session.userId], (error, results) => {
            if (error) {
                throw error;
            }
            if (results.length > 0) {
                // Añadir los datos del usuario a req.user
                req.user = results[0];
                next();
            } else {
                res.redirect('/inicio');
            }
        });
    } else {
        res.redirect('/inicio');
    }
}


function adminMiddleware(req, res, next) {
    if (req.session.rol === 'admin') {
        next();
    } else {
        res.redirect('/inicio');
    }
}

app.get('/', (req, res) => {
    res.render('landingpage');
});


app.get('/inicio', (req, res) => {
    res.render('inicio');
});

app.get('/nuevapass', (req, res) => {
    res.render('nuevapass');
});

app.get('/landingpage', (req, res) => {
    res.render('landingpage');
});

app.get('/Registro', (req, res) => {
    res.render('Registro');
});

app.get('/recuperacion', (req, res) => {
    res.render('recuperacion');
});

app.get('/index', authMiddleware, (req, res) => {
    const sql = 'SELECT * FROM productos';
    oConexion.query(sql, (error, results) => {
        if (error) {
            throw error;
        } else {
            res.render('index', { producto: results, user: req.user });
        }
    });
});


app.get('/admin', [authMiddleware, adminMiddleware], (req, res) => {
    const sql = 'SELECT * FROM productos';
    oConexion.query(sql, (error, results) => {
        if (error) {
            throw error;
        } else {
            res.render('admin', { producto: results, user: req.user });
        }
    });
});


app.get('/editarProd', [authMiddleware, adminMiddleware], (req, res) => {
    res.render('editarProd');
});
app.get('/editarVen', [authMiddleware, adminMiddleware], (req, res) => {
    res.render('editarProd');
});
app.get('/editarUsu', [authMiddleware, adminMiddleware], (req, res) => {
    res.render('editarProd');
});



//INICIO DE SESION//
app.post("/empezar", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT id_usuario, rol FROM usuarios WHERE nombre_usuario = ? AND pass_usuario = ?";
    
    oConexion.query(sql, [username, password], (error, results) => {
        if (error) {
            return res.json({ success: false, message: 'Error en la base de datos' });
        }
        if (results.length > 0) {
            req.session.userId = results[0].id_usuario;
            req.session.rol = results[0].rol;
            if (results[0].rol === 'admin') {
                return res.json({ success: true, redirectUrl: '/admin' });
            } else {
                return res.json({ success: true, redirectUrl: '/index' });
            }
        } else {
            return res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    });
});


//REGISTRO//

app.post("/crear", (req, res) => {
    const { nombre_usuario, pass_usuario, email_usuario, telefono } = req.body;
    const sql = "INSERT INTO usuarios (nombre_usuario, pass_usuario, email_usuario, telefono_usuario, rol) VALUES (?, ?, ?, ?, 'cliente')";
    
   


    oConexion.query(sql, [nombre_usuario, pass_usuario, email_usuario, telefono], function (error) {
        if (error) {
            throw error;
        } else {
            res.redirect('/inicio');
            console.log("Registro correcto");
        }
    });
});


//TRANSBANK//

app.post('/trans', (req, res) => {
    const { amount, sessionId, buyOrder, returnUrl } = req.body;

    tx.create(buyOrder, sessionId, amount, returnUrl)
        .then((response) => {
            res.redirect(response.url + '?token_ws=' + response.token);
        })
        .catch((error) => {
            console.error('Error al iniciar la transacción:', error);
            res.status(500).send('Error al iniciar la transacción');
        });
});

// Ruta para confirmar la transacción con Transbank
app.post('/vuelta', authMiddleware, (req, res) => {
    const { token_ws } = req.body;
    
    if (!token_ws) {
        console.error('No token_ws received');
        return res.status(400).send('No token_ws received');
    }
    
    tx.commit(token_ws)
        .then((response) => {
            console.log('Transacción confirmada:', response);

            if (response.status === 'AUTHORIZED') {
                const sqlVaciarCarrito = 'DELETE FROM carrito WHERE id_usuario = ?';
                oConexion.query(sqlVaciarCarrito, [req.session.userId], (error) => {
                    if (error) {
                        console.error('Error al vaciar el carrito:', error);
                        return res.status(500).send('Error al vaciar el carrito');
                    }

                    console.log('Carrito vaciado para el usuario:', req.session.userId);
                    res.redirect('/boleta');
                });
            } else {
                console.log('Transacción fallida con estado:', response.status);
                res.send('Transacción fallida');
            }
        })
        .catch((err) => {
            console.error('Error al confirmar la transacción:', err);
            res.status(500).send('Error al confirmar la transacción');
        });
});




app.get('/boleta', authMiddleware, (req, res) => {
    const sql = `
        SELECT carrito.*, productos.nombre_producto, productos.precio
        FROM carrito
        JOIN productos ON carrito.id_producto = productos.id_producto
        WHERE carrito.id_usuario = ?
    `;

    oConexion.query(sql, [req.session.userId], (error, results) => {
        if (error) {
            console.error('Error al obtener los detalles del carrito:', error);
            return res.status(500).send('Error al obtener los detalles del carrito');
        }

        let precioTotal = 0;
        results.forEach(item => {
            item.precio_total = item.precio * item.cantidad; 
            precioTotal += item.precio_total;
        });

        const precioConIVA = precioTotal * 1.19;
        const fecha = new Date().toLocaleString();

        res.render('boleta', { productos: results, precioTotal, precioConIVA, fecha });
    });
});









//USUARIOS//

app.get('/mantenedorUsu', [authMiddleware, adminMiddleware], (req, res) => {
    const sql = 'SELECT * FROM usuarios';
    oConexion.query(sql, (error, results) => {
      if (error) {
        throw error;
      } else {
        res.render('mantenedorUsu', { usuarios: results, user: req.user });
      }
    });
  });
  
  

  app.post('/borrarUsuario', (req, res) => {
    const id_usuario = req.body.id_usuario; 
    const sql = "DELETE FROM usuarios WHERE id_usuario = ?";
    oConexion.query(sql, [id_usuario], (error) => {
      if (error) {
        throw error;
      } else {
        res.redirect('/mantenedorUsu');
        console.log("Usuario eliminado correctamente");
      }
    });
  });
  

  app.get('/editarUsu/:id', [authMiddleware, adminMiddleware], (req, res) => {
    const id_usuario = req.params.id;
    const sql = 'SELECT * FROM usuarios WHERE id_usuario = ?';
    oConexion.query(sql, [id_usuario], (error, result) => {
      if (error) {
        throw error;
      } else {
        res.render('editarUsu', { usuario: result[0], user: req.user });
      }
    });
  });
  

  app.post('/actualizarUsu', (req, res) => {
    const id_usuario = req.body.id_usuario;
    const nombre_usuario = req.body.nombre_usuario;
    const pass_usuario = req.body.pass_usuario;
    const email_usuario = req.body.email_usuario;
    const telefono_usuario = req.body.telefono_usuario;
    const rol_usuario = req.body.rol_usuario;
  
    const sql = `UPDATE usuarios SET nombre_usuario = ?, pass_usuario = ?, email_usuario = ?, telefono_usuario = ?, rol = ? WHERE id_usuario = ?`;
    oConexion.query(sql, [nombre_usuario, pass_usuario, email_usuario, telefono_usuario, rol_usuario, id_usuario], (error, results) => {
      if (error) {
        throw error;
      } else {
        console.log("Usuario actualizado correctamente");
        res.redirect('/mantenedorUsu');
      }
    });
  });
  

  app.post("/crearUsu",(req,res)=>{
    const { nombre_usuario, pass_usuario, email_usuario, telefono_usuario, rol_usuario } = req.body;
    const sql = "INSERT INTO usuarios (nombre_usuario, pass_usuario, email_usuario, telefono_usuario, rol) VALUES (?, ?, ?, ?, ?)";
    oConexion.query(sql, [nombre_usuario, pass_usuario, email_usuario, telefono_usuario, rol_usuario], (error) => {
      if (error) {
        throw error;
      } else {
        res.redirect("/mantenedorUsu");
        console.log("Usuario registrado correctamente");
      }
    });
  });
  









//PRODUCTOS//

app.post('/borrar4', (req, res) => {
  const id_producto = req.body.id_producto; 
  const sql = "DELETE FROM productos WHERE id_producto = ?";
  oConexion.query(sql, (error) => {
      if (error) {
          throw error;
      } else {
          res.redirect('/admin');
          console.log("Registro eliminado correctamente");
      }
  });
});



app.get('/editarProducto/:id_producto', [authMiddleware, adminMiddleware], (req, res) => {
  const idProducto = req.params.id_producto;
  const sql = "SELECT * FROM productos WHERE id_producto = ?";
  oConexion.query(sql, [idProducto], (error, results) => {
      if (error) {
          throw error;
      } else {
          res.render('editarProd', { producto: results[0] });
      }
  });
});


app.post('/actualizarProd', (req, res) => {
  const idProducto = req.body.id_producto;
  const nombreProducto = req.body.nombre_producto;
  const precio = req.body.precio;
  const stock = req.body.stock;
  const descripcion = req.body.descripcion;
  const equipo = req.body.equipo;

  const sql = `UPDATE productos 
               SET nombre_producto = ?, precio = ?, stock = ?, descripcion = ?, equipo = ? 
               WHERE id_producto = ?`;
  oConexion.query(sql, [nombreProducto, precio, stock, descripcion, equipo, idProducto], (error, results) => {
      if (error) {
          throw error;
      } else {
          console.log("Producto actualizado correctamente");
          res.redirect('/admin');
      }
  });
});

app.post("/crearProd",(req,res)=>{
    result = req.body;
    sql="insert into productos values (null,'"+result.nombre_producto+"','"+result.precio+"','"+result.stock+"','"+result.descripcion+"','"+result.equipo+"')";
    oConexion.query(sql,function(error){
      if (error) {
          throw error;
      }else{
          res.redirect("admin")
          console.log("Registro correcto");
      }
    });
    });








//VENTAS//


app.get('/mantenedorVen', [authMiddleware, adminMiddleware], (req, res) => {
    const sql = 'SELECT * FROM ventas';
    oConexion.query(sql, (error, results) => {
      if (error) {
        throw error;
      } else {
        res.render('mantenedorVen', { venta: results, user: req.user });
      }
    });
  });

app.post('/borrar5', (req, res) => {
  const id_venta = req.body.id_venta; 
  const sql = "DELETE FROM ventas WHERE id_venta = " + id_venta + "";
  oConexion.query(sql, (error) => {
      if (error) {
          throw error;
      } else {
          res.redirect('/mantenedorVen');
          console.log("Registro eliminado correctamente");
      }
  });
});


app.get('/editarVen/:id', [authMiddleware, adminMiddleware], (req, res) => {
    const id_venta = req.params.id;
    const sql = 'SELECT * FROM ventas WHERE id_venta = ?';
    oConexion.query(sql, [id_venta], (error, result) => {
      if (error) {
        throw error;
      } else {
        res.render('editarVen', { venta: result[0], user: req.user });
      }
    });
  });
  

  app.post('/actualizarVen', (req, res) => {
    const id_venta = req.body.id_venta;
    const id_producto = req.body.id_producto;
    const id_cliente = req.body.id_cliente;
    const cantidad = req.body.cantidad;
    const fecha = req.body.fecha;
  
    const sql = `UPDATE ventas SET id_producto = ?, id_usuario = ?, cantidad = ?, fecha = ? WHERE id_venta = ?`;
    oConexion.query(sql, [id_producto, id_cliente, cantidad, fecha, id_venta], (error, results) => {
      if (error) {
        throw error;
      } else {
        console.log("Venta actualizada correctamente");
        res.redirect('/mantenedorVen');
      }
    });
  });

  app.post("/crearVen",(req,res)=>{
    result = req.body;
    sql="insert into ventas values (null,'"+result.id_producto+"','"+result.id_cliente+"','"+result.cantidad+"','"+result.fecha+"')";
    oConexion.query(sql,function(error){
      if (error) {
          throw error;
      }else{
          res.redirect("mantenedorVen")
          console.log("Registro correcto");
      }
    });
    });




//CARRITO//


app.get('/carrito', authMiddleware, (req, res) => {
    const sql = `
        SELECT carrito.*, productos.nombre_producto, productos.precio
        FROM carrito
        JOIN productos ON carrito.id_producto = productos.id_producto
        WHERE carrito.id_usuario = ?
    `;

    oConexion.query(sql, [req.session.userId], (error, results) => {
        if (error) {
            throw error;
        } else {
            let precioTotal = 0;
            results.forEach(item => {
                item.precio_total = item.precio * item.cantidad; 
                precioTotal += item.precio_total;
            });

            const precioConIVA = precioTotal * 1.19;

            res.render('carrito', { carritos: results, precioTotal, precioConIVA, user: req.user });
        }
    });
});


app.post('/carrito/agregar', authMiddleware, (req, res) => {
    const { id_producto, cantidad } = req.body;

    if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
        return res.send('Cantidad no válida');
    }

    const sqlStock = 'SELECT stock, precio FROM productos WHERE id_producto = ?';
    oConexion.query(sqlStock, [id_producto], (error, results) => {
        if (error) {
            throw error;
        }

        if (results.length > 0) {
            const producto = results[0];
            if (producto.stock >= cantidad) {
                const precio_total = producto.precio * cantidad;
                const sqlCarrito = 'INSERT INTO carrito (id_usuario, id_producto, cantidad, precio_total) VALUES (?, ?, ?, ?)';

                oConexion.query(sqlCarrito, [req.session.userId, id_producto, cantidad, precio_total], (error, results) => {
                    if (error) {
                        throw error;
                    }
                    
                });
            } else {
                res.send('Stock insuficiente');
            }
        } else {
            res.send('Producto no encontrado');
        }
    });
});

app.post('/carrito/vaciar', authMiddleware, (req, res) => {
    const sql = 'DELETE FROM carrito WHERE id_usuario = ?';
    oConexion.query(sql, [req.session.userId], (error, results) => {
        if (error) throw error;
        res.redirect('/carrito');
    });
});

app.post('/ventas/procesar', authMiddleware, (req, res) => {
    const sqlSelect = `
        SELECT carrito.*, productos.nombre_producto, productos.precio
        FROM carrito
        JOIN productos ON carrito.id_producto = productos.id_producto
        WHERE carrito.id_usuario = ?
    `;

    oConexion.query(sqlSelect, [req.session.userId], (error, carritos) => {
        if (error) throw error;

        const sqlInsertVenta = 'INSERT INTO ventas (id_producto, id_usuario, cantidad) VALUES ?';
        const ventasValues = carritos.map(carrito => [carrito.id_producto, req.session.userId, carrito.cantidad]);

        oConexion.query(sqlInsertVenta, [ventasValues], (error, results) => {
            if (error) throw error;

            const sqlVaciarCarrito = 'DELETE FROM carrito WHERE id_usuario = ?';
            oConexion.query(sqlVaciarCarrito, [req.session.userId], (error, results) => {
                if (error) throw error;

                carritos.forEach(carrito => {
                    const sqlUpdateStock = `
                        UPDATE productos
                        SET stock = stock - ?
                        WHERE id_producto = ?
                    `;
                    oConexion.query(sqlUpdateStock, [carrito.cantidad, carrito.id_producto], (error, results) => {
                        if (error) throw error;
                    });
                });

                res.redirect('/carrito');
            });
        });
    });
});










//MIS COMPRAS//


app.get('/mis-compras', authMiddleware, (req, res) => {
    const sql = `
        SELECT ventas.*, productos.nombre_producto
        FROM ventas
        JOIN productos ON ventas.id_producto = productos.id_producto
        WHERE ventas.id_usuario = ?
    `;

    oConexion.query(sql, [req.session.userId], (error, results) => {
        if (error) throw error;

        res.render('mis-compras', { ventas: results, user: req.user });
    });
});











//MIS FAVORITOS//

app.post('/favoritos/toggle', authMiddleware, (req, res) => {
    const { id_producto } = req.body;
    const userId = req.session.userId;

    const sqlCheckFavorito = 'SELECT * FROM favoritos WHERE id_usuario = ? AND id_producto = ?';
    const sqlInsertFavorito = 'INSERT INTO favoritos (id_usuario, id_producto) VALUES (?, ?)';
    const sqlDeleteFavorito = 'DELETE FROM favoritos WHERE id_usuario = ? AND id_producto = ?';

    oConexion.query(sqlCheckFavorito, [userId, id_producto], (error, results) => {
        if (error) throw error;

        if (results.length > 0) {

            oConexion.query(sqlDeleteFavorito, [userId, id_producto], (error, results) => {
                if (error) throw error;
                
            });
        } else {
            
            oConexion.query(sqlInsertFavorito, [userId, id_producto], (error, results) => {
                if (error) throw error;
                
            });
        }
    });
});



app.get('/favoritos', authMiddleware, (req, res) => {
    const sql = `
        SELECT productos.*
        FROM favoritos
        JOIN productos ON favoritos.id_producto = productos.id_producto
        WHERE favoritos.id_usuario = ?
    `;

    oConexion.query(sql, [req.session.userId], (error, results) => {
        if (error) throw error;

        res.render('favoritos', { favoritos: results, user: req.user });
    });
});

app.post('/favoritos/eliminar', authMiddleware, (req, res) => {
    const { id_producto } = req.body;
    const sqlDeleteFavorito = 'DELETE FROM favoritos WHERE id_usuario = ? AND id_producto = ?';

    oConexion.query(sqlDeleteFavorito, [req.session.userId, id_producto], (error, results) => {
        if (error) throw error;
        res.redirect('/favoritos');
    });
}); 






app.set("view engine","ejs")

app.use(express.static("public"))

app.listen(port, () => {
console.log(`Example app listening on port ${port}`)
})
