// set up the server
const express = require("express");
const { auth, requiresAuth } = require('express-openid-connect');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const port = process.env.PORT || 8080;
const logger = require("morgan");
const db = require("./db/db_pool");
const helmet = require("helmet");

// security
app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'"],
          "script-src-attr": ["'self'","'unsafe-inline'"],
        },
      },
      referrerPolicy: {policy: "strict-origin-when-cross-origin"},
    })
  );

// tell express to use ejs
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// logging middleware
app.use(logger("dev"));

// define middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));

// unpack post reqs
app.use(express.urlencoded({ extended: false }));

// auth stuff
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};  
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// provide variables
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;
    next();
})

// ======== ROUTES ========
app.get("/", (req, res) => {
    res.render("index");
});

app.get('/authtest', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

const itemQuery = `SELECT a.id, a.name, a.count, a.description, GROUP_CONCAT(t.name) AS tags FROM items AS a 
    LEFT JOIN taggeditems AS b ON a.id = b.item_id AND a.email = b.email
    LEFT JOIN tags AS t ON b.tag_id = t.id AND b.email = t.email
    WHERE a.id = ? AND a.email = ? GROUP BY a.id`;
app.get("/item/:id", requiresAuth(), (req, res) => {
    db.execute(itemQuery, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else if (results.length == 0) {
            res.status(404).send(`No items found with id ${req.params.id}`);
        }
        else {
            data = results[0];
            if (data.tags) { data.tags = data.tags.split(","); }
            res.render("item", data);
        }

    })
});

const deleteItem = `DELETE FROM items WHERE id = ? AND email = ?`
app.get("/item/:id/delete", requiresAuth(), (req, res) => {
    db.execute(deleteItem, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            if (req.headers.referer?.includes("/list")) {
                res.redirect("back");
            } else {
                res.redirect("/list");
            }
        }
    })
}); 

const decrItem = `UPDATE items SET count = count - 1 WHERE id = ? AND email = ? AND count > 0`
app.get("/item/:id/decr", requiresAuth(), (req, res) => {
    db.execute(decrItem, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(`Decremented ${req.params.id}`)
        }
    })
}); 

const incrItem = `UPDATE items SET count = count + 1 WHERE id = ? AND email = ? AND count > 0`
app.get("/item/:id/incr", requiresAuth(), (req, res) => {
    db.execute(incrItem, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(`Incremented ${req.params.id}`)
        }
    })
}); 

const createItem = `
    INSERT INTO items 
        (name, count, description, sort_order, email) 
    VALUES 
        (?, ?, ?, ?, ?);
`
app.post("/list", requiresAuth(), (req, res) => {
    db.execute("SELECT MAX(sort_order) FROM items WHERE email = ?", [req.oidc.user.email], (error, max) => {
        if (error) {
            res.status(500).send(error);
        } else {
        db.execute(createItem, [req.body.name, req.body.count, req.body.description, max[0]["MAX(sort_order)"] + 10000, req.oidc.user.email], (error, results) => {
            if (error) {
                res.status(500).send(error);
            } else {
                res.redirect(`/item/${results.insertId}`); // TODO FIXME: something with tags
            }
        })
        }
    })
})

const updateItem = `
    UPDATE items
    SET
        name = ?,
        count = ?,
        description = ?
    WHERE id = ? AND email = ?
`
app.post("/item/:id", requiresAuth(), ( req, res ) => {
    db.execute(updateItem, [req.body.name, req.body.count, req.body.description, req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); 
        else {
            res.redirect(`/item/${req.params.id}`);
        }
    });
})

const listQuery = `SELECT a.id, a.name, a.count, a.sort_order, GROUP_CONCAT(t.name) AS tags FROM items AS a 
    LEFT JOIN taggeditems AS b ON a.id = b.item_id AND a.email = b.email
    LEFT JOIN tags AS t ON b.tag_id = t.id AND b.email = t.email
    WHERE a.email = ?
    GROUP BY a.id ORDER BY a.sort_order DESC`;
app.get("/list", requiresAuth(), (req, res) => {
    db.execute(listQuery, [req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            //res.send(results); 
            res.render("list", { inventory: results });
        } // TODO: sort by stuff

    })
});

const tagQuery = `SELECT t.name AS tag, a.name AS item, a.count, a.id, t.description FROM taggeditems AS b 
    INNER JOIN items AS a ON a.id = b.item_id AND a.email = b.email
    INNER JOIN tags AS t ON t.id = b.tag_id AND b.email = t.email
    WHERE t.name = ? AND b.email = ?
    ORDER BY a.count DESC`
app.get("/tag/:name", requiresAuth(), (req, res) => {
    db.execute(tagQuery, [req.params.name, req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else if (results.length == 0) {
            res.status(404).send(`No tag found with name ${req.params.name}`);
        }
        else {
            data = {
                name: results[0].tag,
                description: results[0].description,
                items: results,
                total: results.reduce((c, n) => { return c + n.count }, 0)
            }
            res.render("tag", data);
        }

    })
});

app.get("/hist", (req, res) => {
    res.render("hist");
});

// start the server
app.listen(port, () => {
    console.log(`App server listening on ${port}. (Go to http://localhost:${port})`);
});