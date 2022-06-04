const electron = require('electron');
const {
    app,
    BrowserWindow,
    Menu
} = electron;
const url = require('url');
const http = require('http');
const path = require('path');

// const base_url = 'http://localhost/ngkb_billing/branch';
const base_url = 'https://billing.naidugarikundabiryani.com/branch';

let mainWindow;

let menutemplate = [{
    label: 'Options',
    submenu: [{
            role: 'reload'
        },
        {
            role: 'togglefullscreen'
        }
    ]
}]


app.on('ready', () => {
    mainWindow = new BrowserWindow({
        show: false,
        icon: __dirname + '/icon.png',
    });


    splashScreen = new BrowserWindow({
        width: 620,
        height: 350,
        transparent: true,
        frame: false,
        alwaysOnTop: false,
        icon: __dirname + '/icon.png',
    })

    splashScreen.loadURL(url.format({
        pathname: path.join(__dirname, '/splash/splashscreen.html'),
        protocol: 'file:',
        slashes: true
    }))



    mainWindow.setTitle('Naidu Gari Kunda Biryani POS');
    mainWindow.loadURL(base_url);

    mainWindow.once('ready-to-show', () => {
        splashScreen.destroy()
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.webContents.on("did-fail-load", function (event,errorcode,errdesc) {
        console.log(errdesc);
        console.log(errorcode);
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, '/error/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    });

    // mainWindow.setMenuBarVisibility(false);
    const menu = Menu.buildFromTemplate(menutemplate)
    Menu.setApplicationMenu(menu)




    let available_printers = mainWindow.webContents.getPrinters();
    let http_respose = [];
    // console.log(available_printers);
    available_printers.forEach(function (current_value, index, arr) {
        http_respose.push({
            'name': current_value.displayName,
            'isDefault': current_value.isDefault
        });
    });

    http.createServer(function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.write(JSON.stringify(http_respose));
        res.end();
    }).listen(8050);

    mainWindow.webContents.on('new-window', (event, urlParam, frameName, disposition, options) => {
        event.preventDefault();

        const current_url = new URL(urlParam);
        const search_params = current_url.searchParams;

        let printer = search_params.get('printer');

        let temp_win = new BrowserWindow({
            icon: __dirname + '/icon.png',
            show: false,
        });

        temp_win.setMenuBarVisibility(false);
        temp_win.loadURL(urlParam);
        temp_win.webContents.on('did-finish-load', () => {
            if (frameName == 'Print Kot') {
                //for kot printing....
                temp_win.webContents.print({
                    silent: true,
                    deviceName: printer
                });
                temp_win = null;
            }
            if (frameName == 'Print Bill') {
                temp_win.webContents.print({
                    silent: true,
                    printBackground: true,
                    deviceName: printer
                });
                temp_win = null;
            }
        });
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});