const http = require('http');
const fs = require('fs');
const mysql = require('mysql');
const qs = require('qs');
const url = require('url');
const {json} = require("formidable/src/plugins");

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: 'TestDB',
    charset: 'utf8_general_ci'
});

connection.connect(err => {
    if (err) {
        throw err.stack;
    } else {
        console.log('connect success!!!')
    }
});

http.createServer((req, res) => {

    let parseUrl = url.parse(req.url, true);
    let path = parseUrl.pathname;
    let trimPath = path.replace(/^\/+|\/+$/g, '');

    let chosenHandler = (typeof (router[trimPath]) !== 'undefined') ? router[trimPath] : handlers.notFound;
    chosenHandler(req, res);
}).listen(8080)

let handlers = {};

handlers.render = (req, res) => {
    const selectSql = 'SELECT * FROM customer';
    let html = '';
    fs.readFile('./views/render.html', 'utf-8', (err, data) => {
        connection.query(selectSql, (err, results) => {
            results.forEach(value => {
                html += '<tr>'
                html += `<td>${value.id}</td>`;
                html += `<td>${value.name}</td>`;
                html += `<td>${value.address}</td>`;
                html += `<td><a href="/edit?id=${value.id}">Edit</a></td>`;
                html += `<td><a href="/delete?id=${value.id}">Delete</a></td>`;
                html += '</tr>'
            })

            res.writeHead(200, {'content-type': 'text/html'});
            data = data.replace('list', html)
            res.write(data);
            res.end();
        })
    })
};

handlers.add = (req, res) => {
    if (req.method === 'POST') {
        let data = '';
        req.on('data', chunk => data += chunk)
        req.on('end', () => {
            let data1 = qs.parse(data);
            const insertSql = `INSERT INTO customer(name,address) VALUES('${data1.name}','${data1.address}')`
            connection.query(insertSql, (err) => {
                if (err) throw err
                res.writeHead(301, {
                    Location: '/render' // This is your url which you want
                });
                res.end();
            });
        })
    } else {
        fs.readFile('./views/add.html', 'utf8', (err, data1) => {
            res.writeHead(200, {'content-type': 'text/html'});
            res.write(data1)
            res.end();
        });
    }
};

handlers.edit = (req, res) => {
    if (req.method === 'POST') {
        let data = '';
        req.on('data', (chunk) => data += chunk);
        req.on('end', () => {
            let url1 = url.parse(req.url, true)
            let id = (qs.parse(url1.query)).id;
            let data1 = qs.parse(data);
            const updateSql = `UPDATE customer SET name = '${data1.nameEdit}', address = '${data1.addressEdit}' WHERE customer.id = '${id}'`
            connection.query(updateSql, (err) => {
                if (err) throw err;
                console.log('update ok')
                res.writeHead(301, {
                    Location: '/render' // This is your url which you want
                });
                res.end();

            })
        })


    } else {
        fs.readFile('./views/edit.html', 'utf8', (err, dataEdit) => {
            let url1 = url.parse(req.url, true)
            let id = (qs.parse(url1.query)).id;
            const selectData = `SELECT name,address FROM customer WHERE customer.id = ${id}`
            connection.query(selectData, (err, result) => {
                console.log(result)
                res.writeHead(200, {'content-type': 'text/html'})
                dataEdit = dataEdit.replace('<input type="text" name="nameEdit" placeholder="name">',
                    `<input type="text" name="nameEdit" value ='${result[0].name}'>`
                )
                dataEdit = dataEdit.replace('<input type="text" name="addressEdit" placeholder="address">',
                    `<input type="text" name="addressEdit" value ='${result[0].address}'>`
                )
                res.write(dataEdit)
                res.end();
            })
        })
    }
}

handlers.delete = (req, res) => {
    let url1 = url.parse(req.url, true)
    let id = (qs.parse(url1.query)).id;
    const deleteSql=`Delete FROM customer where id = ${id}`;
    connection.query(deleteSql,err=>{
        console.log('delete ok')
        res.writeHead(301, {
            Location: '/render' // This is your url which you want
        });
        res.end();

    })
}


handlers.notFound = (req, res) => {
    fs.readFile('./views/404.html', (err, data) => {
        res.writeHead(200, {'content-type': 'text/html'});
        res.write(data);
        res.end();
    })
};

let router = {
    'render': handlers.render,
    'add': handlers.add,
    'edit': handlers.edit,
    'delete': handlers.delete
}