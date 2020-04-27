import Router from 'koa-router';
import dbService from "../service/dbService";


const router = new Router();

router
    .get('/', async (ctx, next) => {
        await ctx.render('index');
    })
    .post('/db', async (ctx, next) => {
        const { key } = ctx.request.body;
        const value = await dbService.get(key);
        ctx.status = value ? 200 : 404;
        if (value) ctx.body = value;
    })
    .put('/db', async (ctx, next) => {
        const { key, value } = ctx.request.body;
        await dbService.set(key, value);
        ctx.status = 201;
    })
    .delete('/db', async (ctx, next) => {
        const { key } = ctx.request.body;
        await dbService.remove(key);
        ctx.status = 204;
    });

export default router;