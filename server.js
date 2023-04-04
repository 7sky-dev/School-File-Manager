const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
require('dotenv').config();
app.use(express.static(__dirname + '/public')); //dopisalem ~serek (to jest zeby css dzialal)

const port = 4444;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req,res)=>{
    res.sendFile(__dirname+'\\public\\login.html');
});

app.post('/login', (req,res)=>{
    const password = req.body.password;

    bcrypt.compare(password, process.env.hash, (err, result) => {
        if(result){
            res.sendFile(__dirname+'\\public\\instruction.html');
        }else{
            res.sendFile(__dirname+'\\public\\error.html');
        }
    });
    
});

app.listen(port, (err)=>{
    if(err){
        console.log(err);
    }else{
        console.log(`App listening on: http://127.0.0.1:${port}`);
    }
});