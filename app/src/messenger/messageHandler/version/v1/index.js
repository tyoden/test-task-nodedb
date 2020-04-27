import RequestParser from "./RequestParser";
import ResponseBuilder from "./ResponseBuilder";

export default Object.freeze({
    parser: new RequestParser(),
    builder: new ResponseBuilder()
});