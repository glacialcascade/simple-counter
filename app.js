// set up the server
const express = require("express");
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
          "script-src-attr": ["'self'","'unsafe-inline'"]
        },
      },
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

// routes
app.get("/", (req, res) => {
    res.render("index");
});

const itemQuery = `SELECT a.id, a.name, a.count, a.description, GROUP_CONCAT(t.name) AS tags FROM items AS a 
    LEFT JOIN taggeditems AS b ON a.id = b.item_id
    LEFT JOIN tags AS t ON b.tag_name = t.name
    WHERE a.id = ? GROUP BY a.id`;
app.get("/item/:id", (req, res) => {
    db.execute(itemQuery, [req.params.id], (error, results) => {
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

const deleteItem = `DELETE FROM items WHERE id = ?`
app.get("/item/:id/delete", (req, res) => {
    db.execute(deleteItem, [req.params.id], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            if (req.headers.referer.includes("/list")) {
                res.redirect("back");
            } else {
                res.redirect("/list");
            }
        }
    })
}); // TODO: the row of taggeditems is deleted, but not the row of tags if it is deleted. maybe a good thing?

const createItem = `
    INSERT INTO items 
        (name, count, description, sort_order) 
    VALUES 
        (?, ?, ?, ?);
`
app.post("/list", (req, res) => {
    db.execute("SELECT MAX(sort_order) FROM items", (error, max) => {
        if (error) {
            res.status(500).send(error);
        } else {
        db.execute(createItem, [req.body.name, req.body.count, req.body.description, max[0]["MAX(sort_order)"] + 10000], (error, results) => {
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
    WHERE id = ?
`
app.post("/item/:id", ( req, res ) => {
    db.execute(updateItem, [req.body.name, req.body.count, req.body.description, req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); 
        else {
            res.redirect(`/item/${req.params.id}`);
        }
    });
})

const listQuery = `SELECT a.id, a.name, a.count, a.sort_order, GROUP_CONCAT(t.name) AS tags FROM items AS a 
    LEFT JOIN taggeditems AS b ON a.id = b.item_id 
    LEFT JOIN tags AS t ON b.tag_name = t.name 
    GROUP BY a.id ORDER BY a.sort_order DESC`;
app.get("/list", (req, res) => {
    db.execute(listQuery, (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            //res.send(results); 
            res.render("list", { inventory: results });
        } // TODO: sort by stuff

    })
});

const tagQuery = `SELECT t.name AS tag, a.name AS item, a.count, a.id, t.description FROM taggeditems AS b 
    INNER JOIN items AS a ON a.id = b.item_id 
    INNER JOIN tags AS t ON t.name = b.tag_name
    WHERE b.tag_name = ? ORDER BY a.count DESC`
app.get("/tag/:name", (req, res) => {
    db.execute(tagQuery, [req.params.name], (error, results) => {
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