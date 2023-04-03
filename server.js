const express = require('express');
const app = express();

const port = 4444;

app.get('/', (req,res)=>{
    res.sendFile(__dirname+'\\public\\index.html');
});

app.listen(port, (err)=>{
    if(err){
        console.log(err);
    }else{
        console.log(`App listening on: http://127.0.0.1:${port}`);
    }
});