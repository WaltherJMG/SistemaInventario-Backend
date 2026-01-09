const dotenv = require('dotenv')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Router = require('./routes/test.routes')
dotenv.config()
const app = express()


const port = process.env.PORT || 3000

const withelist = [
    'http://localhost:5173',
    'sistema-inventario-frontend-beige.vercel.app'
]

app.use(morgan('dev'))
app.use(cors({
    origin: function (origin, callback){
        if(!origin) return callback(null, true)
        
        if(withelist.includes(origin)){
            callback(null, true)
        }else{
            console.log("Bloqueado por CORS: ", origin);
            callback(new Error('Bloqueado por CORS'))
            
        }
    }
}))

app.use(express.json())

app.use(Router)


app.use((err, req, res, next) =>{
    return res.status(err.status || 500).json({
        message: err.message || "Problemas con el servidor"
    })
})

app.listen(port, ()=>{
    console.log("Servidor corriendo en puerto", port);
    
})
