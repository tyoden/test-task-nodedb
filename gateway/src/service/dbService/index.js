import DbService from "./DbService";
import config from "../../config";

export default new DbService(config.messenger);