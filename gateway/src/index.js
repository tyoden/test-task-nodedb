import server from './server'
import config from "./config";


const { port } = config.server;
server.listen(port, () => console.log(`Listen port ${port}`));