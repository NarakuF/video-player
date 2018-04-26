let fs = require('fs');
let path = require('path');
let Express = require('express');
let bodyParser = require('body-parser');

const app = Express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const publicPath = path.join(__dirname, '..', 'public');
const dataPath = path.join(__dirname, '..', 'data');

fs.readFile('peanut_butter_and_jelly_sandwich.txt', 'utf-8', (err, data) => {
    if (err) {
        console.log(err);
    }
    console.log(data);
});


app.use(Express.static(publicPath));

app.get('/playlist', (req, res) => {
    fs.readFile('peanut_butter_and_jelly_sandwich.txt', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
        res.send(data.toString().split('\n'));
    });
});

app.post('/save', (req, res) => {
    const data = req.body;
    const fileName = data.src.includes('www.youtube.com') ? data.src.substr(data.src.indexOf('=') + 1) : data.src.replace(/[\/:*?'<>|]/g, '_');
    fs.writeFile(path.join(dataPath, `${fileName}.json`), JSON.stringify(data), err => {
        if (err) {
            console.log(err);
        } else {
            res.send('Saved!');
        }
    });
});

app.listen(8080, () => console.log('running on port 8080'));