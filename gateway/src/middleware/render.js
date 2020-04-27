import path from 'path';
import render from 'koa-ejs';

export default function (app) {
    render(app, {
        root: path.resolve(__dirname, '..', 'view'),
        layout: 'index',
        viewExt: 'ejs',
        cache: false
    });
}