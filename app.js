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
var env = 'Express'
var val = 0
var idp
var tot
var inv
var estatus = 'Procesando'
var carrito = []
var suma_carrito = 0
var max = 0
var nump = 0

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
db.run('CREATE TABLE IF NOT EXISTS pedidogrande(id INTEGER, articulos INTEGER, nombre TEXT, precio INTEGER, envio TEXT, pnvio INTEGER, total INTEGER, estatus TEXT, idc INTEGER)');

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
        let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
        pagina += `<form action="/prueba" method="POST">\
        <fieldset>\
        <label for="fname">Nombre:</label><br>\
        <input type="text" id="nombrelib" name="nombrelib" value=${req.body.nombre} disabled><br>\
        <label for="fname">Autor:</label><br>\
        <input type="text" id="autor" name="autor" value=${req.body.autor } disabled><br>\
        <label for="fname">Precio:</label><br>\
        <input type="text" id="precio" name="precio" value=${req.body.precio} disabled><br>\
        <label for="fname">Ventas:</label><br>\
        <input type="text" id="ventas" name="ventas" value=${req.body.ventas} disabled><br>\
        <label for="fname">Genero:</label><br>\
        <input type="text" id="genero" name="genero" value=${req.body.genero} disabled><br>\
        <label for="fname">Inventario:</label><br>\
        <input type="text" id="Inventario" name="Inventario" value=${req.body.inventario} disabled><br>\
        </fieldset>\
        </form>`;
        pagina += '<br><a href="/" style="a.button">Pagina de inicio</a></body></html>';
        res.send(pagina);
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
        <iframe src="/image" style="border:none;" title="Iframe Example" height="250" width="350"></iframe>\
        <button type ="submit">Comprar</button>\
        <a href="/vista_carrito" style="a.button">enviar al carrito</a>\
        </fieldset>\
        </form>`;
        pagina += '<iframe src="/recomendaciones" style="border:none;" title="Iframe Example" height="400" width="600"></iframe>\</body></html>';
        res.send(pagina);
        console.log("Detalles de libro");
      });
    });
});

//vista de carrito
app.get('/vista_carrito', function(req,res){
    suma_carrito += pre
    carrito.push(nom);
    console.log("Entry" + nom);
    let pagina=`<!DOCTYPE html>\
    <html>\
    <head><link rel = "stylesheet" href="style.css"></head>\
    <body>\
    <label for="fname">Libros:</label><br>`;
    carrito.forEach((row) => {
        pagina +=`<br><input type="text" id="nombre" name="nombre" value=${row} disabled>`;
    }); 
    pagina +=`<br><label for="fname">Total:</label><br>\
    <br><input type="text" id="total_carrito" name="total_carrito" value=${suma_carrito} disabled>\
    <a href="/" style="a.button">Regresar</a>\
    <a href="/compra_carrito" style="a.button">Comprar</a>\
    </body></html>`;
    res.send(pagina);
});

// compra_carrito
app.get('/compra_carrito', function(req,res){
    var pedido_final = "";
    var pedido_pendiente = "";
    tot = suma_carrito + val;
    idp=Math.floor(Math.random() * 10001);
    var disponible = 0;
    var proximo = 0;
    let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
    db.serialize(()=>{
        carrito.forEach((lib) => {
            db.each('SELECT inventario INVENTARIO FROM books WHERE nombre =?', [lib], function(err,row){
                if(err){
                  res.send("Error encountered while updating");
                  return console.error(err.message);
                }else if(row.INVENTARIO > 0){
                    var x = row.INVENTARIO - 1
                    db.run('UPDATE books SET inventario = ? WHERE nombre = ?', [x,lib], function(err){
                        if(err){
                          res.send("Error encountered while updating");
                          return console.error(err.message);
                        }
                    });
                    db.each('SELECT ventas VENTAS FROM books WHERE nombre = ?', [lib], function(err,row){
                      if(err){
                        res.send("Error encountered while updating");
                        return console.error(err.message);
                      }ven= row.VENTAS
                    });
                    ven += 1
                    db.run('UPDATE books SET ventas = ? WHERE nombre = ?', [ven,lib], function(err){
                      if(err){
                        res.send("Error encountered while updating");
                        return console.error(err.message);
                      }
                    });
                    pedido_final += lib;
                    disponible += 1
                }else{
                    pedido_pendiente += lib;
                    proximo += 1
                }
            });
        }); 
        db.run('INSERT INTO pedidogrande(id, articulos, nombre, precio, envio, pnvio, total, estatus, idc) VALUES(?,?,?,?,?,?,?,?,?)', [idp, disponible, pedido_final, suma_carrito, env, val, tot, estatus, id], function(err) {
          if (err) {
            return console.log(err.message);
          }else if(proximo > 0){
            db.run('INSERT INTO pedidogrande(id, articulos, nombre, precio, envio, pnvio, total, estatus, idc) VALUES(?,?,?,?,?,?,?,?,?)', [idp+1, proximo, pedido_pendiente , 0, env, 0, 0, estatus, id], function(err) {
              if (err) {
                return console.log(err.message);
              }else{
                pagina += `<label for="fname">ID pedido:</label><br>\
                <input type="text" id="idp" name="idp" value=${idp+1} disabled><br>\
                <label for="fname">Articulos:</label><br>\
                <input type="text" id="articulos" name="articulos" value=${proximo} disabled><br>\
                <label for="fname">Nombre:</label><br>\
                <input type="text" id="nombrelib" name="nombrelib" value=${pedido_pendiente} disabled><br>\
                <label for="fname">Precio:</label><br>\
                <input type="text" id="precio" name="precio" value=${0} disabled><br>\
                <label for="fname">Envio:</label><br>\
                <input type="text" id="envio" name="envio" value=${env} disabled><br>\
                <label for="fname">Precio de envio:</label><br>\
                <input type="text" id="val" name="val" value=${0} disabled><br>
                <label for="fname">Total:</label><br>\
                <input type="text" id="tot" name="tot" value=${0} disabled><br>
                <label for="fname">Estatus:</label><br>\
                <input type="text" id="estatus" name="estatus" value=${estatus} disabled><br>
                <label for="fname">ID Cliente:</label><br>\
                <input type="text" id="idc" name="idc" value=${id} disabled>`;
                pagina += `<label for="fname">ID pedido:</label><br>\
                <input type="text" id="idp" name="idp" value=${idp} disabled><br>\
                <label for="fname">Articulos:</label><br>\
                <input type="text" id="articulos" name="articulos" value=${disponible} disabled><br>\
                <label for="fname">Nombre:</label><br>\
                <input type="text" id="nombrelib" name="nombrelib" value=${pedido_final} disabled><br>\
                <label for="fname">Precio:</label><br>\
                <input type="text" id="precio" name="precio" value=${suma_carrito} disabled><br>\
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
                <a href="/" style="a.button">Inicio</a>`;
                pagina += '</body></html>';
                res.send(pagina);
                console.log("Un pedido ha sido completado");
              }
            });
          }else {
          pagina += `<label for="fname">ID pedido:</label><br>\
          <input type="text" id="idp" name="idp" value=${idp} disabled><br>\
          <label for="fname">Articulos:</label><br>\
          <input type="text" id="articulos" name="articulos" value=${disponible} disabled><br>\
          <label for="fname">Nombre:</label><br>\
          <input type="text" id="nombrelib" name="nombrelib" value=${pedido_final} disabled><br>\
          <label for="fname">Precio:</label><br>\
          <input type="text" id="precio" name="precio" value=${suma_carrito} disabled><br>\
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
          <a href="/" style="a.button">Inicio</a>`;
          pagina += '</body></html>';
          res.send(pagina);
          console.log("Un pedido ha sido completado");
        }
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
        let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
        pagina += `<h1>Bienvenid@!</h1><form action="/prueba" method="POST">\
        <fieldset>\
        <label for="fname">ID:</label><br>\
        <input type="text" id="idc" name="idc" value=${req.body.idc} disabled><br>\
        <label for="fname">Nombre:</label><br>\
        <input type="text" id="nombrec" name="nombrec" value=${req.body.nombrec} disabled><br>\
        </fieldset>\
        </form><br><a href="/" style="a.button">Pagina de inicio</a>`;
        pagina += '</body></html>';
        res.send(pagina);
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
    idp=Math.floor(Math.random() * 10001);
    db.serialize(()=>{
        db.each('SELECT ventas VENTAS FROM books WHERE nombre =?', [nom], function(err,row){
            if(err){
              res.send("Error encountered while updating");
              return console.error(err.message);
            }
            ven= row.VENTAS
        });
        ven += 1
        db.run('UPDATE books SET inventario = ? WHERE nombre = ?', [inv,nom], function(err){
            if(err){
              res.send("Error encountered while updating");
              return console.error(err.message);
            }
        });
        db.run('UPDATE books SET ventas = ? WHERE nombre = ?', [ven,nom], function(err){
          if(err){
            res.send("Error encountered while updating");
            return console.error(err.message);
          }
          console.log(ven);
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
          <input type="text" id="val" name="val" value=${val} disabled><br>\
          <label for="fname">Total:</label><br>\
          <input type="text" id="tot" name="tot" value=${tot} disabled><br>\
          <label for="fname">Estatus:</label><br>\
          <input type="text" id="estatus" name="estatus" value=${estatus} disabled><br>\
          <label for="fname">ID Cliente:</label><br>\
          <input type="text" id="idc" name="idc" value=${id} disabled><br>\
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
    <head><link rel = "stylesheet" href="style.css"></head>\
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

//plantilla de envio
app.get('/image', function(req,res){
  console.log("Entry" + req.body);
  res.sendFile(path.join(__dirname,`./image/${nom}.jpg`));
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
        let pagina=`<!DOCTYPE html>\
        <html>\
        <head><link rel = "stylesheet" href="style.css"></head>\
        <body>\
        <label for="fname">Nombre:</label><br>\
        <input type="text" id="nombre" name="nombre" value=${req.body.nombre} disabled><br>\
        <label for="fname">Inventario:</label><br>\
        <input type="text" id="Inventario" name="Inventario" value=${req.body.inventario} disabled><br>\
        <a href="/" style="a.button">Pagina principal</a>\
        </body>\
        </html>`;
        res.send(pagina);
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
        let pagina=`<!DOCTYPE html>\
        <html>\
        <head><link rel = "stylesheet" href="style.css"></head>\
        <body>\
        <label for="fname">Nombre:</label><br>\
        <input type="text" id="nombre" name="nombre" value=${req.body.nombre} disabled><br>\
        <a href="/" style="a.button">Pagina principal</a>\
        </body>\
        </html>`;
        res.send(pagina);
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
            <head><link rel = "stylesheet" href="style.css"></head>\
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
app.get('/total_pedidos2', function(req,res){
  let pagina=`<!DOCTYPE html>\
  <html>\
  <head><link rel = "stylesheet" href="style.css"></head>\
  <body>\
  <label for="fname">Pedidos:</label><br>`;
  db.serialize(()=>{
      console.log(gen);
      db.all('SELECT id ID, total TOTAL, estatus ESTATUS, idc IDC FROM pedido', [], function(err,row){ 
        if(err){
          res.send("Error encountered while displaying");
          return console.error(err.message);
        }
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
        console.log("todos los chicos pedidos");
      });
      db.all('SELECT id ID,articulos ARTICULOS, total TOTAL, estatus ESTATUS, idc IDC FROM pedidogrande', [], function(err,row){ 
        if(err){
          res.send("Error encountered while displaying");
          return console.error(err.message);
        }
        row.forEach((row) => {
          pagina +=`<br><input type="text" id="id" name="id" value=${row.ID} disabled>\
          <label for="fname">Articulos:</label>\
          <input type="text" id="articulos" name="articulos" value=${row.ARTICULOS} disabled>\
          <label for="fname">Total:</label>\
          <input type="text" id="total" name="total" value=${row.TOTAL} disabled>\
          <label for="fname">Estatus:</label>\
          <input type="text" id="estatus" name="estatus" value=${row.ESTATUS} disabled>
          <label for="fname">ID cliente:</label>\
          <input type="text" id="idc" name="idc" value=${row.IDC} disabled>`;
        }); 
        pagina +=`</body></html>`;
        res.send(pagina);
        console.log("todos los  grandes pedidos");
      });
  });
});

//libro mas vendido
app.post('/mas_vendido', function(req,res){
  db.serialize(()=>{
      db.all('SELECT ventas VENTAS, nombre NOMBRE FROM books', [], function(err,rows){
        if(err){
          res.send("Error encountered while updating");
          return console.error(err.message);
        }
        rows.forEach((rows) => {
          if(rows.VENTAS > max){
            max = rows.VENTAS
            nom = rows.NOMBRE;
          }
          console.log(rows);
        });
        console.log(max);
      });
      db.all('SELECT nombre NOMBRE FROM books WHERE ventas = ?', [max], function(err,row){ 
        if(err){
          res.send("Error encountered while displaying");
          return console.error(err.message);
        }
        let pagina=`<!DOCTYPE html>\
          <html>\
          <head><link rel = "stylesheet" href="style.css"></head>\
          <body>\
          <label for="fname">Nombre:</label><br>`;
          pagina +=`<br><input type="text" id="nombre" name="nombre" value=${nom} disabled>\
          <label for="fname">Ventas:</label>\
          <input type="text" id="ventas" name="ventas" value=${max} disabled>\
          <br><iframe src="/image" style="border:none;" title="Iframe Example" height="400" width="600"></iframe>\
          <br><a href="/" style="a.button">Pagina de inicio</a>`;
        pagina +=`</body></html>`;
        res.send(pagina);
        console.log("mas vendido");
      });
  });
});

// info cliente
app.post('/info', function(req,res){
  db.serialize(()=>{
    db.each('SELECT id IDC, nombre NOMBREC FROM client WHERE id =?', [req.body.idc], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
      if(err){
        res.send("Error encountered while displaying");
        return console.error(err.message);
      }
      id = row.IDC
      nomc = row.NOMBREC
      let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
      pagina += `<form action="/id_detalles" method="POST">\
      <fieldset>\
      <label for="fname">ID:</label><br>\
      <input type="text" id="idc" name="idc" value=${id} disabled><br>\
      <label for="fname">Nombre:</label><br>\
      <input type="text" id="nombrec" name="nombrec" value=${nomc} disabled><br>\
      <a href="/pedidos_cliente" style="a.button">Todos tus pedidos</a>\
      <a href="/entry_id" style="a.button">Consulta pedido</a>\
      <a href="/entry_idG" style="a.button">Consulta pedido grandes</a>\
      </fieldset>\
      </form><br><a href="/" style="a.button">Pagina de inicio</a>`;
      pagina += '</body></html>';
      res.send(pagina);
      console.log("Entry displayed successfully");
    });
  });
});

//Consulta todos los pedidos
app.get('/pedidos_cliente', function(req,res){
  let pagina=`<!DOCTYPE html>\
  <html>\
  <head><link rel = "stylesheet" href="style.css"></head>\
  <body>\
  <label for="fname">Pedidos:</label><br>`;
  db.serialize(()=>{
      console.log(gen);
      db.all('SELECT id ID, total TOTAL, estatus ESTATUS FROM pedido WHERE idc = ?', [id], function(err,row){ 
        if(err){
          res.send("Error encountered while displaying");
          return console.error(err.message);
        }
        row.forEach((row) => {
          pagina +=`<br><input type="text" id="id" name="id" value=${row.ID} disabled>\
          <label for="fname">Total:</label>\
          <input type="text" id="total" name="total" value=${row.TOTAL} disabled>\
          <label for="fname">Estatus:</label>\
          <input type="text" id="estatus" name="estatus" value=${row.ESTATUS} disabled>`;
        }); 
        console.log("todos los pedidos chicos");
      });
      db.all('SELECT id ID, articulos ARTICULOS, total TOTAL, estatus ESTATUS FROM pedidogrande WHERE idc = ?', [id], function(err,row){ 
        if(err){
          res.send("Error encountered while displaying");
          return console.error(err.message);
        }
        row.forEach((row) => {
          pagina +=`<br><input type="text" id="id" name="id" value=${row.ID} disabled>\
          <label for="fname">Aticulos:</label>\
          <input type="text" id="articulos" name="articulos" value=${row.ARTICULOS} disabled>\
          <label for="fname">Total:</label>\
          <input type="text" id="total" name="total" value=${row.TOTAL} disabled>\
          <label for="fname">Estatus:</label>\
          <input type="text" id="estatus" name="estatus" value=${row.ESTATUS} disabled>`;
        }); 
        pagina +=`<br><a href="/" style="a.button">Pagina de inicio</a></body></html>`;
        res.send(pagina);
        console.log("todos los pedidos grandes");
      });
  });
});

//plantilla id de pedido pra detalles 
app.get('/entry_id', function(req,res){
  let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
  pagina += `<form action="/id_detalles" method="POST">\
  <fieldset>\
  <label for="fname">ID pedido:</label><br>\
  <input type="text" id="nupedido" name="nupedido" placeholder="1,2,3..." required><br>\
  <button type ="submit">Siguiente</button>\
  </fieldset>\
  </form>`;
  pagina +='</body></html>';
  res.send(pagina);
});

//id de pedido pra detalles 
app.post('/id_detalles', function(req,res){
  nump = req.body.nupedido;
  let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
  pagina += `<a href="/detalles_cliente" style="a.button">Siguiente</a>`;
    pagina +='</body></html>';
    res.send(pagina);
});

app.get('/detalles_cliente', function(req,res){
  db.serialize(()=>{
      db.each('SELECT nombre NOMBRE, precio PRECIO, envio ENVIO, pnvio PENVIO, total TOTAL, estatus ESTATUS FROM pedido WHERE id = ?', [nump], function(err,row) {
        if (err) {
          return console.log(err.message);
        }
        let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
        pagina += `
        <label for="fname">Nombre:</label><br>\
        <input type="text" id="nombrelib" name="nombrelib" value=${row.NOMBRE} disabled><br>\
        <label for="fname">Precio:</label><br>\
        <input type="text" id="precio" name="precio" value=${row.PRECIO} disabled><br>\
        <label for="fname">Envio:</label><br>\
        <input type="text" id="envio" name="envio" value=${row.ENVIO} disabled><br>\
        <label for="fname">Precio de envio:</label><br>\
        <input type="text" id="val" name="val" value=${row.PENVIO} disabled><br>\
        <label for="fname">Total:</label><br>\
        <input type="text" id="tot" name="tot" value=${row.TOTAL} disabled><br>\
        <label for="fname">Estatus:</label><br>\
        <input type="text" id="estatus" name="estatus" value=${row.ESTATUS} disabled><br>\
        <a href="/" style="a.button">Siguiente</a>`;
        pagina += '</body></html>';
        res.send(pagina);
      });
    });
});

//plantilla id de pedido pra detalles 
app.get('/entry_idG', function(req,res){
  let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
  pagina += `<form action="/id_detallesG" method="POST">\
  <fieldset>\
  <label for="fname">ID pedido:</label><br>\
  <input type="text" id="nupedido" name="nupedido" placeholder="1,2,3..." required><br>\
  <button type ="submit">Siguiente</button>\
  </fieldset>\
  </form>`;
  pagina +='</body></html>';
  res.send(pagina);
});

//id de pedido pra detalles 
app.post('/id_detallesG', function(req,res){
  nump = req.body.nupedido;
  let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
  pagina += `<a href="/detalles_clienteG" style="a.button">Siguiente</a>`;
    pagina +='</body></html>';
    res.send(pagina);
});

app.get('/detalles_clienteG', function(req,res){
  db.serialize(()=>{
      db.each('SELECT articulos ARTICULOS, nombre NOMBRE, precio PRECIO, envio ENVIO, pnvio PENVIO, total TOTAL, estatus ESTATUS FROM pedidogrande WHERE id = ?', [nump], function(err,row) {
        if (err) {
          return console.log(err.message);
        }
        let pagina='<!doctype html><html><head><link rel = "stylesheet" href="style.css"></head><body>';
        pagina += `
        <label for="fname">Articulos:</label><br>\
        <input type="text" id="Articulos" name="Articulos" value=${row.ARTICULOS} disabled><br>\
        <label for="fname">Nombre:</label><br>\
        <input type="text" id="nombrelib" name="nombrelib" value=${row.NOMBRE} disabled><br>\
        <label for="fname">Precio:</label><br>\
        <input type="text" id="precio" name="precio" value=${row.PRECIO} disabled><br>\
        <label for="fname">Envio:</label><br>\
        <input type="text" id="envio" name="envio" value=${row.ENVIO} disabled><br>\
        <label for="fname">Precio de envio:</label><br>\
        <input type="text" id="val" name="val" value=${row.PENVIO} disabled><br>\
        <label for="fname">Total:</label><br>\
        <input type="text" id="tot" name="tot" value=${row.TOTAL} disabled><br>\
        <label for="fname">Estatus:</label><br>\
        <input type="text" id="estatus" name="estatus" value=${row.ESTATUS} disabled><br>\
        <a href="/" style="a.button">Siguiente</a>`;
        pagina += '</body></html>';
        res.send(pagina);
      });
    });
});