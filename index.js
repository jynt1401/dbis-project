const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const mysql = require("mysql");
const app = express();
const path = require("path");
const session = require("express-session");
const { rawListeners } = require("process");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
);
let currUser;
app.use((req, res, next) => {
  res.locals.currUser = req.session.user;
  res.locals.errMsg = req.session.err;
  next();
});

app.set("view engine", "ejs");

//create connection
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "minor_proj",
});

//connect
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("mysql connected");
});

app.get("/", (req, res) => {
  res.render("sign.ejs", { errMessage: "" });
});
app.get("/home", (req, res) => {
  res.render("home.ejs", { errMessage: "" });
});

app.post("/sign_in", (req, res) => {
  console.log(req.body);
  // res.render('sign.ejs');
  let username = req.body.username;
  let password = req.body.password;

  if (username === "admin" && password === "admin") {
    db.query(
      ` select * from product p
        join category c
        on c.catid=p.cid group by pid`,
      (err, result) => {
        if (err) {
          throw err;
        }
        console.log(result);
        res.render("admin.ejs", { result });
      }
    );
  } else {
    db.query(
      `select * from sign_in WHERE username = ? AND pswd = ?`,
      [username, password],
      (err, result) => {
        console.log(result);
        if (err) console.log(err);
        else {
          console.log(result);
          if (result.length === 0) {
            res.render("createprofile.ejs", { result });
          } else {
            db.query(
              `select * from product p
            join category c
            on c.catid=p.cid group by pid;`,
              (err, result1) => {
                req.session.user = result[0];
                console.log(req.session.user);
                res.render("home.ejs", { result, result1 });
              }
            );
          }
        }
      }
    );
  }
});

app.post("/createprofile", (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var age = req.body.age;
  var gender = req.body.gender;
  var address = req.body.address;
  var mobile = req.body.mobile;

  db.query(
    `insert into sign_in(username,pswd) values(?, ?)`,
    [username, password],
    (err, result) => {
      if (err) console.log(err);
      else {
        db.query(
          `insert into user(name,email,age,gender,address,mobile) values(?, ?, ?, ?, ?, ?);`,
          [username, email, age, gender, address, mobile],
          (err, results) => {
            if (err) console.log(err);
            else console.log(results);

            res.render("sign.ejs", { errMessage: {} });
          }
        );
      }
    }
  );
});

app.get("/logout", (req, res) => {
  res.render("sign.ejs");
});

app.get("/profile/:username/", (req, res) => {
  var { username } = req.params;
  db.query("SELECT * FROM user WHERE name = ?", [username], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.render("profile.ejs", { result });
    }
  });
});

app.get("/update/:username", (req, res) => {
  var { username } = req.params;
  res.render("profile_update.ejs", { username });
});
app.post("/update/:name", (req, res) => {
  var { name } = req.params;

  var _email = req.body.email;
  var _age = req.body.age;
  var _gender = req.body.gender;
  var _address = req.body.address;
  var _mobile = req.body.mobile;

  db.query(
    "UPDATE user SET email = ?, age = ?, gender = ?, address = ?, mobile = ? WHERE name = ?",
    [_email, _age, _gender, _address, _mobile, name],
    (err, result) => {
      if (err) console.log(err);
      else {
        res.redirect(`/profile/${name}`);
      }
    }
  );
});

// admin section.........................

app.get("/add_shoes", (req, res) => {
  db.query(
    ` select * from product p
  join category c
  on c.catid=p.cid group by p.pid`,
    (err, result) => {
      console.log(result[0]);
      res.render("add_shoes.ejs", { result });
    }
  );
});

app.get("/admin", (req, res) => {
  db.query(
    ` select * from product p
    join category c
    on c.catid=p.cid group by p.pid`,
    (err, result) => {
      if (err) console.log(err);
      else res.render("admin.ejs", { result });
    }
  );
});

app.post("/add_shoes_done", (req, res) => {
  var name = req.body.name;
  var color = req.body.color;
  var cost = req.body.cost;
  var size = req.body.size;
  var stock = req.body.stock;
  var cid = req.body.cid;
  var des = req.body.des;

  db.query(
    "INSERT INTO product (pid,name,size,color,cost,stock,des,cid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [pid, name, size, color, cost, stock, des, cid],
    (err, result) => {
      if (err) {
        throw err;
      }
    }
  );

  res.redirect("/admin");
});
app.get("/update_shoes", (req, res) => {
  var shoename = req.query.name;

  let sql = `select * from product where name='${shoename}'`;
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }

    res.render("update_shoes.ejs", { result });
  });
});

app.post("/update_shoes_finally/:stock/:price", (req, res) => {
  let stock = req.params.stock;
  // var prise=res.query.cost;

  let sql = `update table product set stock='${stock}' where name='${name}'`;

  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }

    res.redirect("admin.ejs");
  });
});

app.get("/shop/:name", (req, res) => {
  let shoe_name = req.params.name;
  let username = req.params.username;
  let userid = req.session.user;

  let shop_sql = `SELECT x.* , y.*,z.* FROM 
    (select * from sign_in) as x,
    (select * from reviews) as y,
    (select * from product) as z
    
    where y.productname='${shoe_name}' and y.productname=z.name and x.username='${req.session.user}'`;

  console.log(req.session.user);
  console.log(req.session.user);
  console.log(req.session.user);
  console.log(req.session.user);
  console.log(req.session.user);
  console.log(req.session.user);
  console.log(req.session.user);

  db.query(shop_sql, (err, result) => {
    if (err) {
      throw err;
    }
    console.log(userid);
    console.log(result);
    res.render("shop.ejs", { result });
  });
});

app.get("/cart/:name", (req, res) => {
  var quantity = req.query.quantity;
  let shoe_name = req.params.name;

  let cart_sql = `insert into cart(cust_name,productname,quantity)
    values("${req.session.user}","${shoe_name}",${quantity});`;

  db.query(cart_sql, (err, result) => {
    if (err) {
      throw err;
    }

    res.render("cart.ejs", { result });
  });
});

app.get("/shoedetails/:pid", (req, res) => {
  var { pid } = req.params;

  db.query(
    `select * from product p
    join category c
    on c.catid=p.cid where pid=${pid} group by pid;`,
    (err, result) => {
      if (err) {
        throw err;
      }
      db.query(
        `select * from product p
    join category c
    on c.catid=p.cid where pid=${pid} group by color;`,
        (err, result1) => {
          if (err) {
            throw err;
          }
          db.query(
            `select * from product p
        join category c
        on c.catid=p.cid where pid=${pid} group by size;`,
            (err, result2) => {
              if (err) {
                throw err;
              }
              res.render("ADMINshoedetails.ejs", { result, result1, result2 });
            }
          );
        }
      );
    }
  );
});

app.get("/ushoedetails/:pid/:username", (req, res) => {
  var { pid } = req.params;
  var { username } = req.params;

  db.query(
    `select * from product p
    join category c
    on c.catid=p.cid where pid=${pid} group by pid;`,
    (err, result) => {
      if (err) {
        throw err;
      }
      db.query(
        `select * from product p
      join category c
      on c.catid=p.cid where pid=${pid} group by color;`,
        (err, result1) => {
          if (err) {
            throw err;
          }
          db.query(
            `select * from product p
          join category c
          on c.catid=p.cid where pid=${pid} group by size;`,
            (err, result2) => {
              if (err) {
                throw err;
              }
              res.render("CUSTOMERshoedetails.ejs", {
                result,
                result1,
                result2,
                username,
              });
            }
          );
        }
      );
    }
  );
});

app.post("/buy/:pid/:username", (req, res) => {
  var { pid } = req.params;
  var { username } = req.params;

  var color = req.body.color;
  var size = req.body.size;
  var quantity = req.body.quantity;

  var uid;
  var oid;

  db.query(
    `select id from sign_in where username=?`,
    [username],
    (err, result) => {
      if (err) {
        throw err;
      }
      uid = result[0].id;
    }
  );

  db.query(
    `select * from product where pid=? and color=? and size=?`,
    [pid, color, size],
    (err, result) => {
      if (err) {
        throw err;
      }
      if (quantity > result[0].stock) {
        req.session.err = `for ${color}:${size}: select quantity less than ${result[0].stock}`;
        res.redirect(`/ushoedetails/${pid}/${username}`);
      } else {
        var total = result[0].cost * quantity;
        var stockLeft = result[0].stock - quantity;
        db.query(
          `insert into orders(uid,pid,color,size,cost,quantity,total) 
        values(?,?,?,?,?,?,?)`,
          [uid, pid, color, size, result[0].cost, quantity, total],
          (err, result1) => {
            if (err) {
              console.log("blank");
            } else {
              db.query(
                `update product set stock=? where pid=? and color=? and size=?`,
                [stockLeft, pid, color, size],
                (err, result2) => {
                  if (err) {
                    console.log("blank1");
                  } else {
                    db.query(
                      `select * from orders where uid=?`,
                      [uid],
                      (err, result3) => {
                        res.render("orders.ejs", { result3, username });
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

app.listen("3000", () => {
  console.log("running port 3000");
});
