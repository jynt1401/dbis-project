const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const express=require('express');
const mysql=require('mysql');
const app = express();
const path = require('path');
const session = require("express-session");
const { rawListeners } = require('process');


app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(
    session({
        key: "user",
        secret: "jayant",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 24 * 60 * 60 * 1000,
        },
    })
)
let currUser;
app.use((req,res,next)=>{
    res.locals.currUser=req.session.user;
    next();
})

app.set('view engine','ejs');

//create connection
const db=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'password',
    database:'minor_proj'

});


//connect
db.connect((err)=>{
    if(err){
        throw err;
    }
    console.log('mysql connected')

});





// //insert

// app.get('/',(req,res)=>{
   
//     let v={id:'3',name:'jay',age:'20'};
//     let sql='insert into information SET ?';
//     let query=db.query(sql,v,(err,result)=>{
//         if(err){
//             throw err;
//         }
//         console.log(result)
//         res.send('added row');

//     });
// });



// //select

// app.get('/',(req,res)=>{
//     res.render('sign.ejs')
//     let sql='select * from sign_in';
//     let query=db.query(sql,(err,result)=>{
//         if(err){
//             throw err;
//         }
//         console.log(result)
//         res.send('values......');

//     });
// });


app.get('/',(req,res)=>{
        res.render('sign.ejs', {errMessage: ""})
    
    
});

app.post('/sign_in', (req, res)=>{
    console.log(req.body);
    // res.render('sign.ejs');
    let username = req.body.username;
    let password = req.body.password;

    if(username==="admin" && password==="admin"){
        res.render("admin.ejs");
    }
    else{
        db.query(`SELECT x.* , y.* FROM (select * from sign_in WHERE username = ? AND pswd = ?) as x, (select * from product) as y`,[username, password], (err, result)=>{
            console.log(result);
            if(err) console.log(err);
            else {
                console.log(result);
                if(result.length===0){
                    res.render("sign.ejs", {errMessage: "No such user is found!!!"});
                } else{
                    req.session.user = result[0].username;
                    console.log(req.session.user);
                    res.render("home.ejs", {result});
                }
                
            }
        })
    }
    // var _name= req.query.username
    // var psw=req.query.pswd
    
    // let sql=`select * from sign_in where username='${_name}'`;
    // let insert_sql=`insert into user (name) values ('${_name}')`;
    // let find_sql=`select name from user where name='${_name}'`;
    // let v={name:_name}

    
    


    // db.query(sql,(err,result)=>{
    //     if(err){
    //         throw err;
    //     }
    //     // console.log(result[0].pswd)
    //     if(result.length==0){
    //         res.render('sign.ejs')
    //     }
    //     else if(result[0].username=="admin" && result[0].pswd=="admin"){
    //         res.render('admin.ejs')
    //     }
    //     else if(result[0].pswd==psw)
    //     {
    //         res.render('home.ejs',{result});
    //     }
    //     else{
    //         res.render('sign.ejs',{result})
    //             }
    // })
})

app.get('/logout', (req, res)=>{
res.render('sign.ejs')
    
})

app.get('/profile/:username/', (req, res)=>{

    var {username}= req.params;
    
    
   
    // let insert_sql=`insert into user (name) values ('${username}')`;
    // let find_sql=`select name from user where name='${username}'`;
    
    // let v={name:username}

    // db.query("SELECT name from user ",(err,result)=>{
    //     if(err){
    //         throw err;
    //     }
    //     // console.log(result[0].pswd)
    //     if(result.length==0)
    //     {
    //         db.query(insert_sql, (err,result)=>{
    //             if(err){
    //                 throw err;
    //             }
    //             console.log(v.name);
    //             console.log("vlaue inserted")
                
        
    //         });
    //     }
        
    // })

    db.query("SELECT * FROM user WHERE name = ?", [username],(err,result)=>{
        if(err){
            console.log(err);
        } else {
            res.render('profile.ejs', {result})
        }
        
    
    
})
    
})




app.get('/update/:username', (req, res)=>{
    var {username}= req.params;
    res.render('profile_update.ejs',{username})

    // var _email=req.query.email;
    // var _age=req.query.age;
    // var _gender=req.query.gender;
    // var _address=req.query.address;
    // var _mobile=req.query.mobile;
    // var _alt_moblie=req.query.alt_moblie;

    // let v={email:_email,age:_age,gender:_gender,address:_address,mobile:_mobile,alt_moblie:_alt_moblie};

    // let sql=`update user set email='${_email}' age=${_age} gender='${_gender}' address='${_address}' moblie=${_mobile} alt_mobile=${_alt_moblie} where name='${req.params.username}';`
    // let query=db.query(sql,v, (err,result)=>{
    //     if(err){
    //         throw err;
    //     }
        
    //     console.log("vlaue inserted")
    //     res.send('profile.ejs')
        

    // });



    
})
app.post('/update/:name', (req, res)=>{
    var {name}= req.params;
    // res.render('profile_update.ejs',{result:[{username:username,pswd:password}]})

    var _email=req.body.email;
    var _age=req.body.age;
    var _gender=req.body.gender;
    var _address=req.body.address;
    var _mobile=req.body.mobile;

    db.query("UPDATE user SET email = ?, age = ?, gender = ?, address = ?, mobile = ? WHERE name = ?", [_email, _age, _gender, _address, _mobile, name], (err, result)=>{
        if(err) console.log(err);
        else {
            res.redirect(`/profile/${name}`);
        }
    })
    
    // let sql=`update user set email='${_email}' , age=${_age}, gender='${_gender}', address='${_address}', mobile=${_mobile} where name='${username}'`
    // db.query(sql, (err,result)=>{
    //     if(err){
    //         throw err;
    //     }
        
    //     console.log("vlaue inserted")
    //     res.render('profile.ejs', {result:[{name:name,email:_email,age:_age,gender:_gender,address:_address,mobile:_mobile}]})
        

    // });



    
})

// app.get('/updated',(req,res)=>{
    
//     res.render('profile.ejs')
// })




















// admin section.........................

app.get('/add_shoes',(req,res)=>{
    res.render('add_shoes.ejs')
});
app.get('/inventory',(req,res)=>{
    let sql=`select * from product`;

    db.query(sql, (err,result)=>{
        if(err){
            throw err;
        }
        console.log(result);
       
        res.render('inventory.ejs',{result})
        

    });


    


});


app.get('/add_shoes_done', (req, res)=>{
    var name=req.query.name;
    var company=req.query.company;
    var cost=req.query.cost;
    var size=req.query.size;
    var stock=req.query.stock;
    var category=req.query.category;
    var img_1=req.query.img_1;
    var img_2=req.query.img_2;
    var img_3=req.query.img_3;

    let insert_sql=`insert into product (name,company,cost,size,stock,img_1,img_2,img_3,category) values ('${name}','${company}',${cost},${size},${stock},'${img_1}','${img_2}','${img_3}','${category}');`;
    

    db.query(insert_sql,(err,result)=>{
        if(err){
            throw err;
        } 
    }
    )  
    
    res.render('admin.ejs')
    
  
})
app.get('/update_shoes', (req, res)=>{
    var shoename= req.query.name

    let sql=`select * from product where name='${shoename}'`;
    db.query(sql, (err,result)=>{
        if(err){
            throw err;
        }
        
       
        res.render('update_shoes.ejs', {result})
        

    });
   
    
    
  
})


app.post('/update_shoes_finally/:stock/:price', (req, res)=>{
    
    let stock= req.params.stock;
    // var prise=res.query.cost;

    let sql=`update table product set stock='${stock}' where name='${name}'`;

    
    

   
    db.query(sql, (err,result)=>{
        if(err){
            throw err;
        }
        

        
       
        res.redirect('admin.ejs')
        

    });
   
    
    
  
})

app.get('/shop/:name', (req, res)=>{

    let shoe_name= req.params.name;
    let username=req.params.username;
    let userid=req.session.user;
    
   
    let shop_sql=`SELECT x.* , y.*,z.* FROM 
    (select * from sign_in) as x,
    (select * from reviews) as y,
    (select * from product) as z
    
    where y.productname='${shoe_name}' and y.productname=z.name and x.username='${req.session.user}'`;

    console.log(req.session.user)
    console.log(req.session.user)
    console.log(req.session.user)
    console.log(req.session.user)
    console.log(req.session.user)
    console.log(req.session.user)
    console.log(req.session.user)
   
    db.query(shop_sql, (err,result)=>{
        if(err){
            throw err;
        }
        console.log(userid)
        console.log(result);
        res.render('shop.ejs', {result})
        

    });
   
    
    
  
})



app.get('/cart/:name', (req, res)=>{
    var quantity= req.query.quantity;
    let shoe_name= req.params.name;

    let cart_sql=`insert into cart(cust_name,productname,quantity)
    values("${req.session.user}","${shoe_name}",${quantity});`

    db.query(cart_sql, (err,result)=>{
        if(err){
            throw err;
        }
        
        res.render('cart.ejs', {result})
        

    });
   
    
    
  
})











































app.listen('3000',()=>{
    console.log('running port 3000');

});

