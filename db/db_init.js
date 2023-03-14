// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");
const dotenv = require('dotenv');

dotenv.config();

/**** Delete existing tables, if any ****/

db.execute("DROP TABLE IF EXISTS \`taggeditems\`;");
db.execute("DROP TABLE IF EXISTS \`tags\`;");
db.execute("DROP TABLE IF EXISTS \`items\`;");

/**** Create tables  ****/

const create_tables_sql = [`
    CREATE TABLE tags (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(45) NOT NULL,
        description VARCHAR(150) NULL,
        PRIMARY KEY (id),
        email VARCHAR(50) NULL,
        CONSTRAINT tag_email UNIQUE (name,email)
    );
`, `    
    CREATE TABLE items (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(45) NOT NULL,
        count INT NOT NULL,
        description VARCHAR(150) NULL,
        sort_order INT NOT NULL,
        PRIMARY KEY (id),
        email VARCHAR(50) NULL
    );
`, `    
    CREATE TABLE taggeditems (
        id INT NOT NULL AUTO_INCREMENT,
        item_id INT NOT NULL,
        tag_id INT NOT NULL,
        email VARCHAR(50) NULL,
        PRIMARY KEY (id),
        FOREIGN KEY fk_tag (tag_id) REFERENCES tags (id), 
        FOREIGN KEY fk_item (item_id) REFERENCES items (id)
        ON DELETE CASCADE
    );
`]

// MASSIVELY NEEDS FIXING: update everything to use tag id instead of tag name, oops
db.execute(create_tables_sql[0]);
db.execute(create_tables_sql[1]);
db.execute(create_tables_sql[2]);


/**** Create some sample items ****/

const insert_items_table_sql = `
    INSERT INTO items 
        (name, count, description, sort_order) 
    VALUES 
        (?, ?, ?, ?);
`
const insert_tags_table_sql = `
    INSERT INTO tags 
        (name, description) 
    VALUES 
        (?, ?);
`

const insert_bridge_table_sql = `
    INSERT INTO taggeditems 
        (item_id, tag_id) 
    VALUES 
        (?, ?);
`
db.execute(insert_items_table_sql, ['Cat sightings', '12', 'logging cat sightings', '100000']);
db.execute(insert_items_table_sql, ['Dog sightings', '18', 'logging dog sightings', '90000']);
db.execute(insert_items_table_sql, ['Bird sightings', '15', 'logging bird sightings', '80000']);
db.execute(insert_items_table_sql, ['Socks', '15', 'in the sock drawer', '70000']);
db.execute(insert_items_table_sql, ['Math problems done', '9', null, '60000']);
db.execute(insert_items_table_sql, ['Chemistry problems done', '17', null, '50000']);
db.execute(insert_items_table_sql, ['White cars', '43', 'Counted in an hour on Rte 4', '40000']);
db.execute(insert_items_table_sql, ['Black cars', '23', 'Counted in an hour on Rte 4', '30000']);
db.execute(insert_items_table_sql, ['% progress on prototype', '75', 'for Web Apps class', '20000']);
db.execute(insert_items_table_sql, ['Days until 2024', '359', null, '10000']);


db.execute(insert_tags_table_sql, ['animal', 'This tag is for items that represent some type of animal.']);
db.execute(insert_tags_table_sql, ['counting', 'This tag is for items that count events.']);
db.execute(insert_tags_table_sql, ['inventory', 'This tag is for items that count objects.']);
db.execute(insert_tags_table_sql, ['school', 'This tag is for school-related items.']);
db.execute(insert_tags_table_sql, ['progress', 'This tag is for items that log progress.']);
db.execute(insert_tags_table_sql, ['vehicle', 'This tag is for items that count vehicles.']);

db.execute(insert_bridge_table_sql, ['1', '1']);
db.execute(insert_bridge_table_sql, ['1', '2']);
db.execute(insert_bridge_table_sql, ['2', '1']);
db.execute(insert_bridge_table_sql, ['2', '2']);
db.execute(insert_bridge_table_sql, ['3', '1']);
db.execute(insert_bridge_table_sql, ['3', '2']);
db.execute(insert_bridge_table_sql, ['4', '3']);
db.execute(insert_bridge_table_sql, ['5', '4']);
db.execute(insert_bridge_table_sql, ['5', '5']);
db.execute(insert_bridge_table_sql, ['6', '4']);
db.execute(insert_bridge_table_sql, ['6', '5']);
db.execute(insert_bridge_table_sql, ['7', '6']);
db.execute(insert_bridge_table_sql, ['7', '2']);
db.execute(insert_bridge_table_sql, ['8', '6']);
db.execute(insert_bridge_table_sql, ['8', '2']);
db.execute(insert_bridge_table_sql, ['9', '4']);
db.execute(insert_bridge_table_sql, ['9', '5']);
db.execute(insert_bridge_table_sql, ['10', '5']);


db.execute(`
UPDATE items
SET
    email = ?
`,[process.env.INIT_EMAIL]);
db.execute(`
UPDATE tags
SET
    email = ?
`,[process.env.INIT_EMAIL]);
db.execute(`
UPDATE taggeditems
SET
    email = ?
`,[process.env.INIT_EMAIL]);

/**** Read the sample items inserted ****/

const read_tables_sql = `SELECT a.id, a.name, a.count, a.description, a.sort_order, GROUP_CONCAT(t.name) AS tags
 FROM items AS a LEFT JOIN taggeditems AS b ON b.item_id = a.id INNER JOIN tags AS t ON t.id = b.tag_id GROUP BY a.id`;

db.execute(read_tables_sql,
    (error, results) => {
        if (error)
            throw error;

        console.log("Tables initialized with:")
        console.log(results);
    }
);

db.end();