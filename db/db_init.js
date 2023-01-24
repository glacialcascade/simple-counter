// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");

/**** Delete existing tables, if any ****/

db.execute("DROP TABLE IF EXISTS \`taggeditems\`;");
db.execute("DROP TABLE IF EXISTS \`tags\`;");
db.execute("DROP TABLE IF EXISTS \`items\`;");

/**** Create tables  ****/

const create_tables_sql = [`
    CREATE TABLE tags (
        name VARCHAR(45) NOT NULL,
        description VARCHAR(150) NULL,
        PRIMARY KEY (name)
    );
`, `    
    CREATE TABLE items (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(45) NOT NULL,
        count INT NOT NULL,
        description VARCHAR(150) NULL,
        sort_order INT NOT NULL,
        PRIMARY KEY (id)
    );
`, `    
    CREATE TABLE taggeditems (
        id INT NOT NULL AUTO_INCREMENT,
        item_id INT NOT NULL,
        tag_name VARCHAR(45) NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY fk_tag (tag_name) REFERENCES tags (name),
        FOREIGN KEY fk_item (item_id) REFERENCES items (id)
    );
`]
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
        (item_id, tag_name) 
    VALUES 
        (?, ?);
`
db.execute(insert_items_table_sql, ['Cat sightings', '12', 'logging cat sightings', '1']);
db.execute(insert_items_table_sql, ['Dog sightings', '18', 'logging dog sightings', '2']);
db.execute(insert_items_table_sql, ['Bird sightings', '15', 'logging bird sightings', '3']);
db.execute(insert_items_table_sql, ['Socks', '15', 'in the sock drawer', '4']);
db.execute(insert_items_table_sql, ['Math problems done', '9', null, '5']);

db.execute(insert_tags_table_sql, ['animal', 'This tag is for items that represent some type of animal.']);
db.execute(insert_tags_table_sql, ['counting', 'This tag is for items that count events.']);
db.execute(insert_tags_table_sql, ['inventory', 'This tag is for items that count objects.']);
db.execute(insert_tags_table_sql, ['school', 'This tag is for school-related items.']);
db.execute(insert_tags_table_sql, ['progress', 'This tag is for items that log progress.']);

db.execute(insert_bridge_table_sql, ['1', 'animal']);
db.execute(insert_bridge_table_sql, ['1', 'counting']);
db.execute(insert_bridge_table_sql, ['2', 'animal']);
db.execute(insert_bridge_table_sql, ['2', 'counting']);
db.execute(insert_bridge_table_sql, ['3', 'animal']);
db.execute(insert_bridge_table_sql, ['3', 'counting']);
db.execute(insert_bridge_table_sql, ['4', 'inventory']);
db.execute(insert_bridge_table_sql, ['5', 'school']);
db.execute(insert_bridge_table_sql, ['5', 'progress']);

/**** Read the sample items inserted ****/

const read_tables_sql = "SELECT * FROM tags AS t INNER JOIN taggeditems AS b ON b.tag_name = t.name INNER JOIN items AS i ON i.id = b.item_id";

db.execute(read_tables_sql,
    (error, results) => {
        if (error)
            throw error;

        console.log("Tables initialized with:")
        console.log(results);
    }
);

db.end();