const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Router = require('./routes/test.routes')

const app = express()

app.use(morgan('dev'))
app.use(cors())

app.use(express.json())

app.use(Router)


app.use((err, req, res, next) =>{
    return res.status(err.status || 500).json({
        message: err.message || "Problemas con el servidor"
    })
})


const port = 3000;
app.listen(port, "0.0.0.0", ()=>{
    console.log("Servidor corriendo en puerto", port);
    
})
