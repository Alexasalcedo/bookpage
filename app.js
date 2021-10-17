var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");
var nom
var aut
var pre
var ven
var gen
var id
var nomc
var env
var val
var idp
var tot
var inv
var estatus = 'Procesando'
var recomendacion

var app = express();
var server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

var db = new sqlite3.Database('./database/shop.db');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));
app.use(helmet());
app.use(limiter);

db.run('CREATE TABLE IF NOT EXISTS books(nombre TEXT, autor TEXT, genero TEXT, ventas INTEGER, precio INTEGER, inventario INTEGER)');
db.run('CREATE TABLE IF NOT EXISTS client(id INTEGER, nombre TEXT)');
db.run('CREATE TABLE IF NOT EXISTS pedido(id INTEGER, nombre TEXT, precio INTEGER, envio TEXT, pnvio INTEGER, total INTEGER, estatus TEXT, idc INTEGER)');

app.get('/', function(req,res){
    res.sendFile(path.join(__dirname,'./public/form.html'));
});


// Agrega libros
app.post('/add', function(req,res){
    db.serialize(()=>{
      db.run('INSERT INTO books(nombre, autor, genero, ventas, precio, inventario) VALUES(?,?,?,?,?,?)', [req.body.nombre, req.body.autor,req.body.genero, req.body.ventas,req.body.precio, req.body.inventario], function(err) {
        if (err) {
          return console.log(err.message);
        }
        console.log("Nuevo libro ha sido agregado");
        res.send("Nuevo libro ha sido agregado= "+req.body.nombre + req.body.autor + req.body.genero + req.body.ventas + req.body.precio + req.body.inventario);
      });
    });
  });

// Detalles de libros
app.post('/view', function(req,res){
    db.serialize(()=>{
      db.each('SELECT nombre NOMBRE, autor AUTOR, precio PRECIO, ventas VENTAS,genero GENERO, inventario INVENTARIO FROM books WHERE nombre =?', [req.body.nombre], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
        if(err){
          res.send("Error encountered while displaying");
          return console.error(err.message);
        }
        nom = row.NOMBRE;
        aut = row.AUTOR;
        pre = row.PRECIO;
        ven = row.VENTAS;
        gen = row.GENERO;
        inv = row.INVENTARIO
        let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
        pagina += `<form action="/prueba" method="POST">\
        <fieldset>\
        <label for="fname">Nombre:</label><br>\
        <input type="text" id="nombrelib" name="nombrelib" value=${nom} disabled><br>\
        <label for="fname">Autor:</label><br>\
        <input type="text" id="autor" name="autor" value=${aut} disabled><br>\
        <label for="fname">Precio:</label><br>\
        <input type="text" id="precio" name="precio" value=${pre} disabled><br>\
        <label for="fname">Ventas:</label><br>\
        <input type="text" id="ventas" name="ventas" value=${ven} disabled><br>\
        <label for="fname">Genero:</label><br>\
        <input type="text" id="genero" name="genero" value=${gen} disabled><br>\
        <button type ="submit">Comprar</button>\
        </fieldset>\
        </form>`;
        pagina += '<iframe src="/recomendaciones" style="border:none;" title="Iframe Example" height="400" width="600"></iframe>\</body></html>';
        res.send(pagina);
        console.log("Detalles de libro");
      });
    });
});

//recibe la informacion del envio
app.post('/pedido', function(req,res){
    env=req.body.envio
    if(env == 'Estandar'){
        val = 0
    } else if(env == 'Corto'){
        val = 50
    } else {
        val = 100
    }
    res.send("Pedido con envio tipo: "+req.body.envio+val);
    console.log("Entry pedidos");
  });

//plantilla de clientes
app.post('/client', function(req,res){
    res.sendFile(path.join(__dirname,'./public/clientes.html'));
});

// Agrega clientes
app.post('/add_cliente', function(req,res){
    db.serialize(()=>{
      db.run('INSERT INTO client(id, nombre) VALUES(?,?)', [req.body.idc, req.body.nombrec], function(err) {
        if (err) {
          return console.log(err.message);
        }
        console.log("Nuevo cliente ha sido agregado");
        res.send("Nuevo cliente ha sido agregado= "+req.body.idc + req.body.nombrec);
      });
    });
  });

// log in
app.post('/login', function(req,res){
    db.serialize(()=>{
      db.each('SELECT id IDC, nombre NOMBREC FROM client WHERE id =?', [req.body.idc], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
        if(err){
          res.send("Error encountered while displaying");
          return console.error(err.message);
        }
        id = row.IDC
        nomc = row.NOMBREC
        let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
        pagina += `<form action="/prueba" method="POST">\
        <fieldset>\
        <label for="fname">ID:</label><br>\
        <input type="text" id="idc" name="idc" value=${id} disabled><br>\
        <label for="fname">Nombre:</label><br>\
        <input type="text" id="nombrec" name="nombrec" value=${nomc} disabled><br>\
        <a href="/vista_pedido" style="a.button">Siguiente</a>\
        </fieldset>\
        </form>`;
        pagina += '</body></html>';
        res.send(pagina);
        console.log("Entry displayed successfully");
      });
    });
  });

//Vista general de pedido
app.get('/vista_pedido', function(req,res){
    inv = inv - 1;
    tot = pre + val;
    idp=Math.floor(Math.random() * 101);
    db.serialize(()=>{
        db.run('UPDATE books SET inventario = ? WHERE nombre = ?', [inv,nom], function(err){
            if(err){
              res.send("Error encountered while updating");
              return console.error(err.message);
            }
        });
        db.run('INSERT INTO pedido(id, nombre, precio, envio, pnvio, total, estatus, idc) VALUES(?,?,?,?,?,?,?,?)', [idp, nom, pre, env, val, tot, estatus, id], function(err) {
          if (err) {
            return console.log(err.message);
          }
          let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
          pagina += `<label for="fname">ID pedido:</label><br>\
          <input type="text" id="idp" name="idp" value=${idp} disabled><br>\
          <label for="fname">Nombre:</label><br>\
          <input type="text" id="nombrelib" name="nombrelib" value=${nom} disabled><br>\
          <label for="fname">Precio:</label><br>\
          <input type="text" id="precio" name="precio" value=${pre} disabled><br>\
          <label for="fname">Envio:</label><br>\
          <input type="text" id="envio" name="envio" value=${env} disabled><br>\
          <label for="fname">Precio de envio:</label><br>\
          <input type="text" id="val" name="val" value=${val} disabled><br>
          <label for="fname">Total:</label><br>\
          <input type="text" id="tot" name="tot" value=${tot} disabled><br>
          <label for="fname">Estatus:</label><br>\
          <input type="text" id="estatus" name="estatus" value=${estatus} disabled><br>
          <label for="fname">ID Cliente:</label><br>\
          <input type="text" id="idc" name="idc" value=${id} disabled><br>
          <a href="/" style="a.button">Siguiente</a>`;
          pagina += '</body></html>';
          res.send(pagina);
          console.log("Un pedido ha sido completado");
        });
      });
});

// pre-pedido
app.post('/prueba', function(req,res){
    let pagina=`<!DOCTYPE html>\
    <html>\
    <body>\
    <label for="fname">Nombre:</label><br>\
    <input type="text" id="nombre" name="nombre" value=${nom} disabled><br>\
    <label for="fname">Precio:</label><br>\
    <input type="text" id="precio" name="precio" value=${pre} disabled><br>\
    <iframe src="/about" style="border:none;" title="Iframe Example" height="400" width="600"></iframe>\
    <form action="/client" method="POST">\
    <fieldset>\
    <button type ="submit">Siguiente</button>\
    </fieldset>\
    </form>\
    </body>\
    </html>`;
    res.send(pagina);
    console.log("Entry compra");
});

//plantilla de envio
app.get('/about', function(req,res){
    console.log("Entry" + req.body);
    res.sendFile(path.join(__dirname,'./public/envios.html'));
});

//recomendacionesview
app.get('/recomendaciones', function(req,res){
    console.log("Entry" + req.body);
    res.sendFile(path.join(__dirname,'./public/recom.html'));
});

//Update
app.post('/update', function(req,res){
    db.serialize(()=>{
      db.run('UPDATE books SET inventario = ? WHERE nombre = ?', [req.body.inventario,req.body.nombre], function(err){
        if(err){
          res.send("Error encountered while updating");
          return console.error(err.message);
        }
        res.send("Entry updated successfully");
        console.log("Entry updated successfully");
      });
    });
  });

// Delete
app.post('/delete', function(req,res){
    db.serialize(()=>{
      db.run('DELETE FROM books WHERE nombre = ?', req.body.nombre, function(err) {
        if (err) {
          res.send("Error encountered while deleting");
          return console.error(err.message);
        }
        res.send("Entry deleted");
        console.log("Entry deleted");
      });
    });
  
  });

// Closing the database connection.
app.get('/close', function(req,res){
    db.close((err) => {
      if (err) {
        res.send('There is some error in closing the database');
        return console.error(err.message);
      }
      console.log('Closing the database connection.');
      res.send('Database connection successfully closed');
    });
  
  });

  server.listen(3000, function(){
    console.log("server is listening on port: 3000");
  });

//recomendaciones
app.post('/r', function(req,res){
    db.serialize(()=>{
        console.log(gen);
        db.all('SELECT nombre NOMBRE,autor AUTOR FROM books WHERE genero =? and nombre !=?', [gen,nom], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
          if(err){
            res.send("Error encountered while displaying");
            return console.error(err.message);
          }
          let pagina=`<!DOCTYPE html>\
            <html>\
            <body>\
            <label for="fname">Recomendacion:</label><br>`;
          row.forEach((row) => {
            console.log(row.NOMBRE,row.AUTOR);
            pagina +=`<br><input type="text" id="nombre" name="nombre" value=${row.NOMBRE} disabled>\
            <label for="fname">Autor:</label>\
            <input type="text" id="autor" name="autor" value=${row.AUTOR} disabled>`;
          }); 
          pagina +=`</body></html>`;
          res.send(pagina);
          console.log("recomendaciones");
        });
    });
});

//Consulta todos los pedidos
app.post('/total_pedidos', function(req,res){
    db.serialize(()=>{
        console.log(gen);
        db.all('SELECT id ID, total TOTAL, estatus ESTATUS, idc IDC FROM pedido', [], function(err,row){ 
          if(err){
            res.send("Error encountered while displaying");
            return console.error(err.message);
          }
          let pagina=`<!DOCTYPE html>\
            <html>\
            <body>\
            <label for="fname">Pedidos:</label><br>`;
          row.forEach((row) => {
            pagina +=`<br><input type="text" id="id" name="id" value=${row.ID} disabled>\
            <label for="fname">Total:</label>\
            <input type="text" id="total" name="total" value=${row.TOTAL} disabled>\
            <label for="fname">Estatus:</label>\
            <input type="text" id="estatus" name="estatus" value=${row.ESTATUS} disabled>
            <label for="fname">ID cliente:</label>\
            <input type="text" id="idc" name="idc" value=${row.IDC} disabled>`;
          }); 
          pagina +=`</body></html>`;
          res.send(pagina);
          console.log("todos los pedidos");
        });
    });
});