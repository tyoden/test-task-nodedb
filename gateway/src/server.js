import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import router from './middleware/router';
import render from './middleware/render'
import dbService from './service/dbService'

const app = new Koa();

render(app);
app.use(bodyparser());
app.use(router.allowedMethods());
app.use(router.routes());

export default {
    listen(...args) {
        dbService.init().then(() => {
            app.listen(...args);
        })
    }
}