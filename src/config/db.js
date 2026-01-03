const {Pool}  = require('pg')
const dotenv = require('dotenv')
dotenv.config()

const db = new Pool({
    user: process.env.USUARIO,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: 5432,
    database: process.env.DATABASE
})

module.exports = db;