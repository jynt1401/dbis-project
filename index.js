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
        db.query(
          `select * from category where catid in (select cid from product p
          join category c
          on c.catid=p.cid group by p.cid) order by catid;`,
          (err, result1) => {
            res.render("admin.ejs", { result, result1 });
          }
        );
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
              ` select * from product p
                join category c
                on c.catid=p.cid group by pid`,
              (err, result2) => {
                if (err) {
                  throw err;
                }
                db.query(
                  `select * from category where catid in (select cid from product p
                  join category c
                  on c.catid=p.cid group by p.cid) order by catid`,
                  (err, result1) => {
                    res.render("home.ejs", { result2, result1, result });
                  }
                );
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
  req.session.destroy();
  console.log("Logged out");
  // console.log(req.session.user);
  res.render("sign.ejs", { errMessage: "" });
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
      if (err) {
        console.log("error");
      } else {
        db.query(`select * from category`, (err, result1) => {
          res.render("add_shoes.ejs", { result, result1 });
        });
      }
    }
  );
});

app.get("/admin", (req, res) => {
  db.query(
    ` select * from product p
      join category c
      on c.catid=p.cid group by pid`,
    (err, result) => {
      if (err) {
        throw err;
      }
      db.query(
        `select * from category where catid in (select cid from product p
        join category c
        on c.catid=p.cid group by p.cid) order by catid;`,
        (err, result1) => {
          res.render("admin.ejs", { result, result1 });
        }
      );
    }
  );
});

app.post("/add_shoes_done", (req, res) => {
  var name = req.body.name;
  var color = req.body.color;
  var cost = req.body.cost;
  var size = req.body.size;
  var stock = req.body.stock;
  var cid = req.body.catid;
  var des = req.body.des;
  var existsAlready = "Shoe already existed: You can update it!";

  db.query(
    `select * from product p join category c on c.catid=p.cid where name=? and size=? and color=?`,
    [name, size, color],
    (err, result) => {
      if (err) {
        throw err;
      } else if (result.length > 0) {
        db.query(
          `select * from category where catid<>?`,
          [result[0].cid],
          (err, result1) => {
            if (err) {
              throw err;
            }
            res.render("update_shoes_from_select.ejs", {
              result,
              result1,
              existsAlready,
            });
          }
        );
      } else {
        db.query(`select max(pid) from product;`, (err, result1) => {
          console.log(result1[0]["max(pid)"] + 1);
          db.query(
            `insert into product(pid,name,color,size,cost,cid,stock,des) values(?,?,?,?,?,?,?,?)`,
            [
              result1[0]["max(pid)"] + 1,
              name,
              color,
              size,
              cost,
              cid,
              stock,
              des,
            ],
            (err, result2) => {
              res.redirect(`/shoedetails/${result1[0]["max(pid)"] + 1}`);
            }
          );
        });
      }
    }
  );
});

app.post("/update_shoe/:pid/:color/:size", (req, res) => {
  var { pid } = req.params;
  var { size } = req.params;
  var { color } = req.params;
  var cost = req.body.cost;
  var stock = req.body.stock;
  var des = req.body.des;

  db.query(
    `select * from product where pid=? and color=? and size=? and cost=?`,
    [pid, color, size, cost],
    (err, result) => {
      if (result.length === 0) {
        db.query(
          `update product set cost=? where pid=?`,
          [cost, pid],
          (err, result1) => {
            db.query(
              `update product set stock=?,des=? where pid=? and color=? and size=?`,
              [stock, des, pid, color, size],
              (err, result2) => {
                res.redirect(`/shoedetails/${pid}`);
              }
            );
          }
        );
      } else {
        db.query(
          `update product set stock=?,des=? where pid=? and color=? and size=?`,
          [stock, des, pid, color, size],
          (err, result2) => {
            res.redirect(`/shoedetails/${pid}`);
          }
        );
      }
    }
  );
});

app.get("/shoedetails/:pid", (req, res) => {
  var { pid } = req.params;
  db.query(
    `select * from product p
    join category c
    on c.catid=p.cid where pid=? group by pid;`,
    [pid],
    (err, result) => {
      if (err) {
        throw err;
      }
      db.query(
        `select * from product p
    join category c
    on c.catid=p.cid where p.pid=? group by color;`,
        [pid],
        (err, result1) => {
          if (err) {
            console.log(pid);
          }
          db.query(
            `select * from product p
        join category c
        on c.catid=p.cid where pid=? group by size;`,
            [pid],
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

app.get("/orders/:username", (req, res) => {
  var { username } = req.params;

  db.query(`select * from users where name=?`, [username], (err, result1) => {
    db.query(
      `select * from orders o join product p on p.pid=o.pid where o.uid=? order by oid desc`,
      [uid],
      (err, result3) => {
        if (err) {
          throw err;
        }
        res.render("orders.ejs", { result3, username });
      }
    );
  });
});

app.post("/buy/:pid/:username", (req, res) => {
  var { pid } = req.params;
  var { username } = req.params;

  var color = req.body.color;
  var size = req.body.size;
  var quantity = req.body.quantity;

  var uid;
  var today = new Date();
  var orderdate =
    today.getFullYear() +
    "-" +
    (today.getMonth() + 1 < 10 ? "0" : "") +
    (today.getMonth() + 1) +
    "-" +
    today.getDate();
  var future = new Date(); // get today date
  future.setDate(future.getDate() + 7); // add 7 days
  var deliverydate =
    future.getFullYear() +
    "-" +
    (future.getMonth() + 1 < 10 ? "0" : "") +
    (future.getMonth() + 1) +
    "-" +
    future.getDate();

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
          `insert into orders(uid,pid,color,size,cost,quantity,total,orderdate,deliverydate) 
        values(?,?,?,?,?,?,?)`,
          [
            uid,
            pid,
            color,
            size,
            result[0].cost,
            quantity,
            total,
            orderdate,
            deliverydate,
          ],
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
                      `select * from orders o join product p on p.pid=o.pid where uid=? order by oid desc`,
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
