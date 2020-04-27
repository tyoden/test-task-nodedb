import Application from "./Application";
import config from "./config";

new Application(config)
    .init()
    .then(() => console.log("The application is started and ready to process incoming messages"));
