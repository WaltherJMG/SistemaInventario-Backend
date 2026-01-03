const DB = require('../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require("bcryptjs") // recomendado
const dotenv = require('dotenv')
dotenv.config()


//PETICION POST PARA AUTENTICACION DE USUARIO - INICIO SESION
const open_login = async(req, res, next) =>{
    try{
        const {Login, Contrasena} = req.body
        const consult = await DB.query('SELECT * FROM Usuario WHERE (ID_Usuario::text = $1 OR Correo_Electronico=$1)', 
            [Login])
        if(consult.rowCount === 0){
            return res.status(401).json({
                message: "El usuario no existe"
            })
        }

        const usuario = consult.rows[0]

        const validar_password = await bcrypt.compare(Contrasena, usuario.contrasena)
        
        if(validar_password === false){
            return res.status(401).json({
                message: "Contraseña incorrecta"
            })
        }

        const token = jwt.sign({
            id: usuario.id_usuario,
            rol: usuario.rol
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        })
        const {password, ...usuarioSeguro} = usuario
        return res.status(200).json({
            message: "Login correcto",
            token,
            usuario: usuarioSeguro
        })

    }catch(error){
        next(error)
    }
}


//PETICION POR MEDIO DE POST PARA REGISTRAR USUARIOS 
const create_user = async (req, res, next) =>{
    try{
        const {ID_Usuario, Nombre, Apellido, Correo_Electronico, Contrasena, Rol, Estado} = req.body
        const password_hasheo = await bcrypt.hash(Contrasena, 10)
        const result = await DB.query('INSERT INTO Usuario (ID_Usuario, Nombre, Apellido, Correo_Electronico, Contrasena, Rol, Estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [
            ID_Usuario, Nombre, Apellido, Correo_Electronico, password_hasheo, Rol, Estado
        ])
        res.json(result.rows[0])
    }catch(error){
        next(error)
    }
}

//PETICION POR MEDIO DE GET PARA OBTENER DATOS - PRODUCTOS

const list_products = async (req, res) => {
  try {
    const result = await DB.query(`
      SELECT 
        p.id_producto,
        p.id_categoria,
        c.nombrecategoria AS nombrecategoria,
        p.nombreproducto,
        p.descripcion,
        p.precio,
        p.stock,
        p.estado
      FROM producto p
      INNER JOIN categoria c
      ON p.id_categoria = c.id_categoria
    `);

    res.json(result.rows);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
};


//PETICION AGREGAR PRODUCTOS

const add_products = async (req, res, next) => {
  try {
    const data = req.body;

    // Extraemos los campos, considerando mayúsculas/minúsculas
    const ID_Producto = data.id_producto ?? data.ID_Producto;
    const ID_Categoria = data.id_categoria ?? data.ID_Categoria;
    const NombreProducto = data.nombreproducto ?? data.NombreProducto;
    const Descripcion = data.descripcion ?? data.Descripcion;
    const Precio = data.precio ?? data.Precio;
    const Stock = data.stock ?? data.Stock;
    const Estado = data.estado ?? data.Estado;

    // Inserción en la base de datos
    const result = await DB.query(
      `INSERT INTO Producto
        (ID_Producto, ID_Categoria, NombreProducto, Descripcion, Precio, Stock, Estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
      [
        ID_Producto,
        ID_Categoria,
        NombreProducto,
        Descripcion,
        Precio,
        Stock,
        Estado,
      ]
    );

    // Respuesta al frontend
    res.status(201).json({
      message: "Producto agregado",
      producto: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al agregar producto", error: error.message });
  }
};

//PETICION GET PARA OBTENER LAS CATEGORIAS
const category = async (req, res) => {
  try {
    const result = await DB.query("SELECT * FROM Categoria ORDER BY ID_Categoria");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener categorías" });
  }
}

//PETICION PARA ACTUALZAR PRODUCTOS
const update_product = async (req, res, next) => {
  try {
    const id = req.params.id; 
    const data = req.body;

    const result = await DB.query(
      `UPDATE Producto
       SET ID_Categoria = $1,
           NombreProducto = $2,
           Descripcion = $3,
           Precio = $4,
           Stock = $5,
           Estado = $6
       WHERE ID_Producto = $7
       RETURNING *`,
      [
        data.ID_Categoria,
        data.NombreProducto,
        data.Descripcion,
        data.Precio,
        data.Stock,
        data.Estado,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "Producto actualizado", producto: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar producto", error: error.message });
  }
};

//PETICION PARA ELIMINAR UN PRODUCTO
const delete_products = async (req, res) => {
  const { id } = req.params;

  try {
    await DB.query("DELETE FROM Producto WHERE id_producto = $1", [id]);
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al eliminar el producto" });
  }
}

// PETICION PARA OBTENER MOVIMIENTOS
const obtain_movements = async (req, res) => {
  try {
    const result = await DB.query(`
      SELECT 
        m.id_movimiento,
        CASE WHEN m.tipomovimiento = TRUE THEN 'Entrada' ELSE 'Salida' END AS tipo,
        m.cantidad,
        m.fecha,
        m.observacion,
        p.nombreproducto,
        u.nombre AS usuario
      FROM movimiento m
      INNER JOIN producto p ON m.id_producto = p.id_producto
      INNER JOIN usuario u ON m.id_usuario = u.id_usuario
      ORDER BY m.fecha DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener movimientos" });
  }
};


// PETICION PARA REGISTRAR MOVIMIENTO
const regist_movements = async (req, res) => {
  let { tipoMovimiento, cantidad, fecha, observacion, id_usuario, id_producto } = req.body;

  console.log("BODY:", req.body); // <-- IMPORTANTE PARA VER QUÉ ESTÁ LLEGANDO

  try {
    // Convertir tipo movimiento a boolean
    if (tipoMovimiento === "Entrada" || tipoMovimiento === true) tipoMovimiento = true;
    if (tipoMovimiento === "Salida"  || tipoMovimiento === false) tipoMovimiento = false;

    // Convertir IDs a integer
    id_usuario = parseInt(id_usuario);
    id_producto = parseInt(id_producto);

    // Si no envían fecha → usamos hoy
    if (!fecha || fecha === "") fecha = new Date().toISOString().split("T")[0];

    await DB.query(`
      INSERT INTO movimiento (tipomovimiento, cantidad, fecha, observacion, id_usuario, id_producto)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [tipoMovimiento, cantidad, fecha, observacion || null, id_usuario, id_producto]);

    res.json({ message: "Movimiento registrado correctamente" });

  } catch (error) {
    console.log("ERROR BD:", error);
    res.status(500).json({ message: "Error al registrar movimiento", error });
  }
};


const list_users = async (req, res) => {
  try {
    const result = await DB.query(`
      SELECT id_usuario, nombre 
      FROM usuario
      ORDER BY nombre ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

const delete_movement = async (req, res) => {
  const { id } = req.params;

  try {
    await DB.query(
      "DELETE FROM movimiento WHERE id_movimiento = $1",
      [id]
    );

    res.json({ message: "Movimiento eliminado correctamente" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al eliminar movimiento" });
  }
};


module.exports = {
    create_user,
    open_login,
    list_products,
    add_products,
    category,
    update_product,
    delete_products,
    obtain_movements,
    regist_movements,
    list_users,
    delete_movement
}